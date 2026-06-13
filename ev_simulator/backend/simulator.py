import numpy as np
from typing import List, Dict, Literal, Tuple
from config import DEFAULT_EFFICIENCY, THERMAL_LOSS_COEFFICIENT, ELECTRICITY_COST_PER_KWH

class ChargingSimulator:
    """
    Enhanced EV Dynamic Charging Simulator
    Simulates battery charging dynamics with thermal considerations and multiple charging modes
    """
    
    def __init__(self):
        self.default_efficiency = DEFAULT_EFFICIENCY
        self.thermal_loss_coeff = THERMAL_LOSS_COEFFICIENT
        self.electricity_cost = ELECTRICITY_COST_PER_KWH
        
    def simulate(self, battery_capacity: float, current_battery: float, 
                 charger_power: float, ambient_temperature: float) -> dict:
        """
        Legacy simulation method for backward compatibility
        """
        current_battery_kwh = (current_battery / 100) * battery_capacity
        energy_to_charge = battery_capacity - current_battery_kwh
        charging_curve_factor = 1 + (0.1 * (current_battery / 100))
        base_charging_time = energy_to_charge / charger_power * charging_curve_factor
        
        temp_factor = max(0.7, 1.0 - (abs(ambient_temperature - 25) / 100))
        power_factor = max(0.8, 1.0 - (charger_power - 50) / 500)
        efficiency = self.default_efficiency * temp_factor * power_factor
        
        actual_energy_drawn = energy_to_charge / efficiency
        energy_loss = actual_energy_drawn - energy_to_charge
        
        power_normalized = charger_power / 100
        base_temp_rise = power_normalized * base_charging_time * 8
        temp_rise_factor = 1 + (abs(ambient_temperature - 25) / 50)
        battery_temperature_rise = base_temp_rise * temp_rise_factor
        
        charging_time_minutes = base_charging_time * 60
        final_battery_percentage = 100.0
        cost_estimate = actual_energy_drawn * self.electricity_cost
        
        return {
            "charging_time_minutes": charging_time_minutes,
            "final_battery_percentage": final_battery_percentage,
            "battery_temperature_rise": battery_temperature_rise,
            "efficiency_percentage": efficiency * 100,
            "energy_loss_kwh": energy_loss,
            "cost_estimate": cost_estimate,
        }
    
    def simulate_advanced(self, battery_capacity_kwh: float, current_soc: float,
                         target_soc: float, grid_voltage: float, 
                         ambient_temp_celsius: float, 
                         charging_mode: Literal["slow", "fast", "dynamic"]) -> dict:
        """
        Advanced simulation with charging modes and detailed charge curves
        
        Args:
            battery_capacity_kwh: Total battery capacity
            current_soc: Current state of charge (0-100)
            target_soc: Target state of charge (0-100)
            grid_voltage: Grid voltage in volts
            ambient_temp_celsius: Ambient temperature
            charging_mode: slow/fast/dynamic
        
        Returns:
            Complete simulation result with charge curve
        """
        # Calculate charging power based on mode
        charger_power_kw = self._calculate_charger_power(
            charging_mode, battery_capacity_kwh, grid_voltage
        )
        
        # Calculate energy to deliver
        energy_needed_kwh = battery_capacity_kwh * (target_soc - current_soc) / 100
        
        # Generate charge curve with time steps
        charge_curve = self._generate_charge_curve(
            battery_capacity_kwh, current_soc, target_soc,
            charger_power_kw, ambient_temp_celsius, charging_mode
        )
        
        # Calculate metrics from charge curve
        estimated_time_minutes = charge_curve[-1]["time"] if charge_curve else 0
        
        # Calculate efficiency based on ambient temperature and charging mode
        efficiency_percent = self._calculate_efficiency(
            ambient_temp_celsius, charging_mode, charger_power_kw
        )
        
        # Actual energy drawn (accounting for losses)
        energy_delivered_kwh = energy_needed_kwh
        actual_energy_drawn = energy_delivered_kwh / (efficiency_percent / 100)
        
        # Cost calculation (INR at 8 per kWh default)
        inr_per_kwh = 8.0  # India average electricity cost
        cost_estimate_inr = actual_energy_drawn * inr_per_kwh
        
        # Thermal status based on charge curve
        max_power = max(point["power_kw"] for point in charge_curve) if charge_curve else 0
        thermal_status = self._calculate_thermal_status(
            max_power, ambient_temp_celsius, estimated_time_minutes
        )
        
        return {
            "estimated_time_minutes": estimated_time_minutes,
            "energy_delivered_kWh": energy_delivered_kwh,
            "cost_estimate_inr": cost_estimate_inr,
            "efficiency_percent": efficiency_percent,
            "charge_curve": charge_curve,
            "thermal_status": thermal_status,
        }
    
    def _calculate_charger_power(self, mode: str, battery_capacity: float, 
                                 grid_voltage: float) -> float:
        """Calculate appropriate charger power based on mode"""
        # Base power calculation based on grid voltage (simulated)
        base_power = (grid_voltage / 400) * 50  # Normalized to 400V
        
        if mode == "slow":
            return base_power * 0.7  # 70% of base
        elif mode == "fast":
            return base_power * 1.5  # 150% of base
        else:  # dynamic
            return base_power * 1.0  # 100% of base
    
    def _generate_charge_curve(self, battery_capacity: float, current_soc: float,
                               target_soc: float, charger_power_kw: float,
                               ambient_temp: float, charging_mode: str) -> List[Dict]:
        """Generate detailed charge curve with time and power points"""
        curve_points = []
        
        # Time step in seconds (simulate with 30-second intervals)
        time_step_seconds = 30
        current_time_minutes = 0
        current_soc_sim = current_soc
        
        max_iterations = 24 * 3600 * 60  # 24 hours in 30-second steps
        iteration = 0
        
        while current_soc_sim < target_soc and iteration < max_iterations:
            # Calculate current power output (tapering at high SOC)
            soc_ratio = current_soc_sim / 100
            taper_factor = 1.0
            
            if charging_mode == "slow":
                # Slow charging: linear tapering from 60% SOC
                if soc_ratio > 0.6:
                    taper_factor = max(0.3, 1.0 - (soc_ratio - 0.6) * 1.75)
            elif charging_mode == "fast":
                # Fast charging: aggressive tapering from 80% SOC
                if soc_ratio > 0.8:
                    taper_factor = max(0.2, 1.0 - (soc_ratio - 0.8) * 4.0)
            else:  # dynamic
                # Dynamic: moderate tapering from 70% SOC
                if soc_ratio > 0.7:
                    taper_factor = max(0.25, 1.0 - (soc_ratio - 0.7) * 2.5)
            
            # Apply temperature derating
            temp_derate = self._calculate_temperature_derate(ambient_temp)
            actual_power = charger_power_kw * taper_factor * temp_derate
            
            # Calculate energy delivered in this time step
            energy_kwh = (actual_power * time_step_seconds) / 3600
            
            # Update SOC
            current_soc_sim = min(target_soc, current_soc_sim + (energy_kwh / battery_capacity) * 100)
            current_time_minutes += time_step_seconds / 60
            
            # Add point to curve (every 5 minutes for readability)
            if iteration % 10 == 0:
                curve_points.append({
                    "time": round(current_time_minutes, 1),
                    "soc": round(current_soc_sim, 1),
                    "power_kw": round(actual_power, 2)
                })
            
            iteration += 1
        
        # Always add final point
        if curve_points and curve_points[-1]["soc"] < target_soc:
            curve_points.append({
                "time": round(current_time_minutes, 1),
                "soc": round(target_soc, 1),
                "power_kw": 0.5
            })
        
        return curve_points
    
    def _calculate_efficiency(self, ambient_temp: float, charging_mode: str,
                              charger_power: float) -> float:
        """Calculate charging efficiency based on conditions"""
        base_efficiency = 92.0  # 92% base efficiency
        
        # Temperature impact
        temp_loss = 0
        if ambient_temp < 0:
            temp_loss = 5.0  # 5% loss in cold
        elif ambient_temp > 40:
            temp_loss = 3.0  # 3% loss in heat
        
        # Mode impact
        mode_factor = 1.0
        if charging_mode == "slow":
            mode_factor = 1.02  # Slightly more efficient
        elif charging_mode == "fast":
            mode_factor = 0.96  # Slightly less efficient
        
        # Power derating impact (higher power = slight loss)
        power_loss = min(2.0, charger_power / 100)
        
        efficiency = base_efficiency - temp_loss - power_loss
        efficiency = max(80.0, min(95.0, efficiency))  # Clamp between 80-95%
        
        return efficiency * mode_factor
    
    def _calculate_temperature_derate(self, ambient_temp: float) -> float:
        """Calculate power derating due to temperature"""
        if ambient_temp < -10:
            return 0.6
        elif ambient_temp < 0:
            return 0.8
        elif ambient_temp > 45:
            return 0.7
        elif ambient_temp > 35:
            return 0.85
        return 1.0
    
    def _calculate_thermal_status(self, max_power: float, ambient_temp: float,
                                  time_minutes: float) -> Literal["normal", "warm", "hot"]:
        """Determine thermal status based on charging conditions"""
        # Simplified thermal calculation
        heat_generation = max_power * (time_minutes / 60)
        
        # Adjust for ambient temperature
        if ambient_temp > 35:
            heat_generation *= 1.2
        elif ambient_temp < 0:
            heat_generation *= 0.8
        
        # Threshold determination
        if heat_generation > 150:
            return "hot"
        elif heat_generation > 80:
            return "warm"
        else:
            return "normal"
