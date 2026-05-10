import numpy as np
from scipy.optimize import curve_fit
from typing import Tuple, Dict
import json

class BatteryModel:
    """
    Physics-based battery charging model
    Implements lithium-ion battery charging characteristics
    """
    
    def __init__(self):
        # Battery parameters
        self.nominal_voltage = 400  # V (typical for EV)
        self.internal_resistance = 0.01  # Ohm
        self.thermal_mass = 150  # J/K (heat capacity)
        
        # Charging parameters
        self.cc_cv_transition = 0.8  # SOC at which charging transitions from CC to CV
        
    def calculate_charging_curve(self, soc: float, charger_power: float) -> Tuple[float, float]:
        """
        Calculate current and voltage for given state of charge
        
        Args:
            soc: State of charge (0-1)
            charger_power: Charger power in kW
        
        Returns:
            Tuple of (current in A, voltage in V)
        """
        # Constant Current phase (0-80% SOC)
        if soc < self.cc_cv_transition:
            # Current is limited by charger power
            voltage_cc = self.nominal_voltage * (0.4 + 0.6 * soc)
            current = (charger_power * 1000) / voltage_cc
            return current, voltage_cc
        
        # Constant Voltage phase (80-100% SOC)
        else:
            max_voltage = self.nominal_voltage * 1.05
            voltage_cv = max_voltage
            # Current decreases as battery fills
            current_reduction = (soc - self.cc_cv_transition) / (1 - self.cc_cv_transition)
            max_current = (charger_power * 1000) / max_voltage
            current = max_current * (1 - 0.9 * current_reduction)
            return current, voltage_cv
    
    def calculate_thermal_dynamics(self, current: float, ambient_temp: float, 
                                   battery_temp: float, time_step: float) -> float:
        """
        Calculate battery temperature change
        
        Args:
            current: Charging current in A
            ambient_temp: Ambient temperature in °C
            battery_temp: Current battery temperature in °C
            time_step: Time step in seconds
        
        Returns:
            New battery temperature in °C
        """
        # Joule heating
        joule_heat = (current ** 2) * self.internal_resistance  # Power in W
        
        # Convective cooling to ambient
        cooling_coefficient = 0.05  # W/K
        convective_loss = cooling_coefficient * (battery_temp - ambient_temp)
        
        # Net heat power
        net_heat = joule_heat - convective_loss
        
        # Temperature change
        temp_change = net_heat / self.thermal_mass * time_step
        new_temp = battery_temp + temp_change
        
        return new_temp

class ChargingOptimizer:
    """
    Optimizes charging profile based on objectives
    """
    
    def __init__(self):
        self.battery_model = BatteryModel()
    
    def calculate_optimal_power(self, current_soc: float, target_soc: float,
                               available_time: float, ambient_temp: float) -> float:
        """
        Calculate optimal charger power for given constraints
        
        Args:
            current_soc: Current state of charge (0-1)
            target_soc: Target state of charge (0-1)
            available_time: Available charging time in seconds
            ambient_temp: Ambient temperature in °C
        
        Returns:
            Optimal charger power in kW
        """
        # Base calculation
        soc_delta = target_soc - current_soc
        base_power = (soc_delta * 60) / (available_time / 3600)  # kWh / hours = kW
        
        # Thermal constraint: reduce power if ambient temp is high
        if ambient_temp > 35:
            thermal_factor = 0.8
        elif ambient_temp < 0:
            thermal_factor = 0.6
        else:
            thermal_factor = 1.0
        
        optimal_power = base_power * thermal_factor
        
        # Clamp to practical limits
        optimal_power = max(7, min(350, optimal_power))
        
        return optimal_power

class SimulationEngine:
    """
    Main simulation engine combining battery model and optimizer
    """
    
    def __init__(self):
        self.battery_model = BatteryModel()
        self.optimizer = ChargingOptimizer()
        self.time_step = 1  # seconds
    
    def run_simulation(self, battery_capacity: float, initial_soc: float,
                      target_soc: float, charger_power: float,
                      ambient_temp: float) -> Dict:
        """
        Run complete charging simulation
        
        Returns:
            Dictionary with detailed simulation results
        """
        # Initialize
        current_soc = initial_soc
        battery_temp = ambient_temp
        time_elapsed = 0
        total_energy = 0
        heat_dissipated = 0
        
        # Simulation loop
        max_iterations = 24 * 3600 * 100  # 24 hours with 0.01s resolution
        iteration = 0
        
        while current_soc < target_soc and iteration < max_iterations:
            # Get charging parameters
            current, voltage = self.battery_model.calculate_charging_curve(
                current_soc, charger_power
            )
            
            # Calculate energy transferred in this step
            energy_step = (current * voltage * self.time_step) / (3600 * 1000)  # kWh
            
            # Update SOC
            current_soc = min(1.0, current_soc + energy_step / battery_capacity)
            
            # Update temperature
            battery_temp = self.battery_model.calculate_thermal_dynamics(
                current, ambient_temp, battery_temp, self.time_step
            )
            
            # Accumulate metrics
            total_energy += energy_step
            heat_dissipated += (current ** 2) * self.battery_model.internal_resistance * self.time_step / 1000
            time_elapsed += self.time_step
            iteration += 1
        
        # Calculate results
        charging_time_minutes = time_elapsed / 60
        final_soc = current_soc * 100
        temp_rise = battery_temp - ambient_temp
        efficiency = (current_soc * battery_capacity) / total_energy if total_energy > 0 else 0
        
        return {
            "charging_time_minutes": charging_time_minutes,
            "final_soc_percentage": final_soc,
            "battery_temperature_rise": temp_rise,
            "efficiency_percentage": efficiency * 100,
            "total_energy_drawn_kwh": total_energy,
            "heat_dissipated_kwh": heat_dissipated,
        }

# Factory for model initialization
def create_simulation_engine() -> SimulationEngine:
    """Factory function to create simulation engine"""
    return SimulationEngine()
