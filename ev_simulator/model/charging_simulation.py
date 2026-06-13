import numpy as np
from typing import Dict, List, Tuple
from datetime import datetime, time
import math

class EVChargingSimulator:
    """
    Physics-based EV charging simulator implementing CC-CV charging model
    with thermal dynamics and dynamic power adjustments.
    """

    def __init__(self):
        # Battery physics parameters
        self.nominal_voltage = 400.0  # V (typical EV pack voltage)
        self.internal_resistance = 0.015  # Ohm (battery internal resistance)
        self.thermal_mass = 3000.0  # J/K (battery thermal capacity - much higher for realistic temps)
        self.cc_cv_transition_soc = 0.8  # SOC where CC transitions to CV

        # Charging limits
        self.max_charging_power_kw = 150.0  # Maximum charger power
        self.min_charging_power_kw = 1.0  # Minimum charging power

        # Thermal parameters
        self.cooling_threshold_temp = 40.0  # °C - cooling activates above this
        self.cooling_coefficient = 0.15  # W/K - cooling effectiveness (increased)
        self.ambient_cooling_coeff = 0.05  # W/K - natural convection (increased)

        # Temperature derating parameters
        self.hot_temp_threshold = 35.0  # °C - derate above this
        self.cold_temp_threshold = 5.0  # °C - derate below this
        self.hot_derate_factor = 0.7  # 70% power reduction in hot weather
        self.cold_derate_factor = 0.6  # 60% power reduction in cold weather

        # Grid voltage parameters
        self.nominal_grid_voltage = 400.0  # V - nominal grid voltage
        self.voltage_tolerance = 0.05  # 5% voltage fluctuation tolerance

        # Time-of-use pricing (INR per kWh)
        self.base_rate_per_kwh = 8.0  # Base rate
        self.peak_multiplier = 2.0  # Peak hours cost 2x
        self.peak_hours = [
            (time(6, 0), time(9, 0)),   # Morning peak: 6-9am
            (time(18, 0), time(21, 0))  # Evening peak: 6-9pm
        ]

    def _is_peak_hour(self, current_time: datetime) -> bool:
        """Check if current time is in peak hours."""
        current_t = current_time.time()
        for start, end in self.peak_hours:
            if start <= current_t <= end:
                return True
        return False

    def _calculate_soc_taper_factor(self, soc: float) -> float:
        """
        Calculate power taper factor based on SOC.
        Above 80% SOC, power tapers to prevent overcharging.
        """
        if soc < self.cc_cv_transition_soc:
            return 1.0
        elif soc >= 1.0:
            return 0.0
        else:
            # Smooth taper from 80% to 100% SOC
            taper_progress = (soc - self.cc_cv_transition_soc) / (1.0 - self.cc_cv_transition_soc)
            # Exponential decay for realistic S-curve
            return math.exp(-2.5 * taper_progress)

    def _calculate_temperature_derate_factor(self, ambient_temp: float) -> float:
        """Calculate power derating factor based on ambient temperature."""
        if ambient_temp > self.hot_temp_threshold:
            return self.hot_derate_factor
        elif ambient_temp < self.cold_temp_threshold:
            return self.cold_derate_factor
        else:
            return 1.0

    def _calculate_voltage_derate_factor(self, grid_voltage: float) -> float:
        """Calculate power derating factor based on grid voltage fluctuation."""
        voltage_deviation = abs(grid_voltage - self.nominal_grid_voltage) / self.nominal_grid_voltage

        if voltage_deviation > self.voltage_tolerance:
            # Reduce power proportionally to voltage deviation
            return max(0.5, 1.0 - voltage_deviation)
        else:
            return 1.0

    def _calculate_available_power(self, base_power_kw: float, soc: float,
                                 ambient_temp: float, grid_voltage: float) -> float:
        """Calculate actual available charging power after all deratings."""
        soc_factor = self._calculate_soc_taper_factor(soc)
        temp_factor = self._calculate_temperature_derate_factor(ambient_temp)
        voltage_factor = self._calculate_voltage_derate_factor(grid_voltage)

        available_power = base_power_kw * soc_factor * temp_factor * voltage_factor
        return np.clip(available_power, self.min_charging_power_kw, self.max_charging_power_kw)

    def _calculate_charging_efficiency(self, power_kw: float, battery_temp: float,
                                     ambient_temp: float) -> float:
        """Calculate charging efficiency based on conditions."""
        # Base efficiency
        base_efficiency = 0.92

        # Temperature efficiency modifier
        temp_diff = abs(battery_temp - 25.0)  # Optimal temperature is 25°C
        temp_penalty = temp_diff * 0.002  # 0.2% efficiency loss per °C deviation

        # Power efficiency modifier (higher power = slightly lower efficiency)
        power_penalty = (power_kw / self.max_charging_power_kw) * 0.02

        efficiency = base_efficiency - temp_penalty - power_penalty
        return max(0.75, min(0.95, efficiency))  # Clamp between 75-95%

    def _calculate_thermal_dynamics(self, charging_power_w: float, ambient_temp: float,
                                  battery_temp: float, time_step_sec: float) -> float:
        """Calculate battery temperature change including cooling effects."""
        # Joule heating from internal resistance (more realistic calculation)
        # Heat generated is I²R, but we can estimate as a fraction of charging power
        heat_loss_factor = 0.05  # 5% of charging power becomes heat
        joule_heating_w = charging_power_w * heat_loss_factor

        # Active cooling (kicks in above threshold)
        cooling_power_w = 0.0
        if battery_temp > self.cooling_threshold_temp:
            temp_above_threshold = battery_temp - self.cooling_threshold_temp
            cooling_power_w = self.cooling_coefficient * temp_above_threshold

        # Natural convection to ambient
        ambient_cooling_w = self.ambient_cooling_coeff * (battery_temp - ambient_temp)

        # Net heat flow
        net_heat_w = joule_heating_w - cooling_power_w - ambient_cooling_w

        # Temperature change
        temp_change = net_heat_w / self.thermal_mass * time_step_sec
        new_temp = battery_temp + temp_change

        return new_temp

    def _calculate_soc_change(self, charging_power_w: float, battery_capacity_wh: float,
                            efficiency: float, time_step_sec: float) -> float:
        """Calculate change in state of charge."""
        # Energy delivered to battery (accounting for efficiency)
        energy_delivered_wh = charging_power_w * time_step_sec / 3600.0 * efficiency

        # SOC change
        soc_change = energy_delivered_wh / battery_capacity_wh

        return soc_change

    def simulate_charging(self, battery_capacity_kwh: float, current_soc: float,
                         target_soc: float, charger_power_kw: float,
                         ambient_temp_celsius: float, grid_voltage: float,
                         start_time: datetime = None) -> Dict:
        """
        Run complete charging simulation with 1-minute time steps.

        Args:
            battery_capacity_kwh: Battery capacity in kWh
            current_soc: Current state of charge (0-1)
            target_soc: Target state of charge (0-1)
            charger_power_kw: Maximum charger power in kW
            ambient_temp_celsius: Ambient temperature in °C
            grid_voltage: Grid voltage in V
            start_time: Start time for cost calculation (defaults to now)

        Returns:
            Dict containing simulation results
        """
        if start_time is None:
            start_time = datetime.now()

        # Input validation
        if not (0.0 <= current_soc <= 1.0):
            raise ValueError("Current SOC must be between 0 and 1")
        if not (0.0 <= target_soc <= 1.0):
            raise ValueError("Target SOC must be between 0 and 1")
        if current_soc >= target_soc:
            raise ValueError("Target SOC must be greater than current SOC")

        # Convert units
        battery_capacity_wh = battery_capacity_kwh * 1000.0
        time_step_sec = 60.0  # 1 minute intervals

        # Initialize simulation state
        soc = current_soc
        battery_temp = ambient_temp_celsius  # Start at ambient temperature
        total_energy_delivered_kwh = 0.0
        total_cost_inr = 0.0
        simulation_time_min = 0.0

        # Results arrays
        time_array = []
        soc_array = []
        power_array = []
        temp_array = []
        efficiency_array = []

        # Simulation loop
        while soc < target_soc and simulation_time_min < 1000:  # Safety limit: 1000 minutes
            current_time = start_time

            # Calculate available charging power
            available_power_kw = self._calculate_available_power(
                charger_power_kw, soc, ambient_temp_celsius, grid_voltage
            )

            # Calculate charging efficiency
            efficiency = self._calculate_charging_efficiency(
                available_power_kw, battery_temp, ambient_temp_celsius
            )

            # Calculate SOC change
            charging_power_w = available_power_kw * 1000.0
            soc_change = self._calculate_soc_change(
                charging_power_w, battery_capacity_wh, efficiency, time_step_sec
            )

            # Update SOC (don't exceed target)
            new_soc = min(soc + soc_change, target_soc)

            # Calculate energy delivered this step
            energy_step_kwh = (new_soc - soc) * battery_capacity_kwh / efficiency
            total_energy_delivered_kwh += energy_step_kwh

            # Calculate cost for this time step
            is_peak = self._is_peak_hour(current_time)
            rate_per_kwh = self.base_rate_per_kwh * (self.peak_multiplier if is_peak else 1.0)
            cost_step_inr = energy_step_kwh * rate_per_kwh
            total_cost_inr += cost_step_inr

            # Update battery temperature
            battery_temp = self._calculate_thermal_dynamics(
                charging_power_w, ambient_temp_celsius, battery_temp, time_step_sec
            )

            # Store results
            time_array.append(simulation_time_min)
            soc_array.append(soc * 100.0)  # Convert to percentage
            power_array.append(available_power_kw)
            temp_array.append(battery_temp)
            efficiency_array.append(efficiency * 100.0)  # Convert to percentage

            # Update state
            soc = new_soc
            simulation_time_min += 1.0
            # Properly increment time (handle hour rollover)
            minutes_to_add = 1
            new_minute = start_time.minute + minutes_to_add
            new_hour = start_time.hour + (new_minute // 60)
            new_minute = new_minute % 60
            new_hour = new_hour % 24
            start_time = start_time.replace(hour=new_hour, minute=new_minute)

            # Break if we've reached target SOC
            if soc >= target_soc:
                break

        # Calculate final metrics
        total_time_minutes = simulation_time_min
        average_power_kw = np.mean(power_array) if power_array else 0.0
        average_efficiency = np.mean(efficiency_array) if efficiency_array else 0.0
        max_temperature = max(temp_array) if temp_array else ambient_temp_celsius
        thermal_status = self._get_thermal_status(max_temperature)

        return {
            "estimated_time_minutes": round(total_time_minutes, 1),
            "energy_delivered_kWh": round(total_energy_delivered_kwh, 2),
            "cost_estimate_inr": round(total_cost_inr, 2),
            "average_power_kW": round(average_power_kw, 2),
            "average_efficiency_percent": round(average_efficiency, 1),
            "max_battery_temp_celsius": round(max_temperature, 1),
            "thermal_status": thermal_status,
            "charge_curve": {
                "time_minutes": time_array,
                "soc_percent": soc_array,
                "power_kW": power_array,
                "battery_temp_celsius": temp_array,
                "efficiency_percent": efficiency_array
            },
            "status": "success"
        }

    def _get_thermal_status(self, temperature: float) -> str:
        """Determine thermal status based on temperature."""
        if temperature < 35.0:
            return "normal"
        elif temperature < 45.0:
            return "warm"
        else:
            return "hot"

    def get_charging_recommendations(self, battery_capacity_kwh: float,
                                   current_soc: float, target_soc: float,
                                   ambient_temp_celsius: float) -> Dict:
        """
        Get charging recommendations based on conditions.

        Args:
            battery_capacity_kwh: Battery capacity in kWh
            current_soc: Current state of charge (0-1)
            target_soc: Target state of charge (0-1)
            ambient_temp_celsius: Ambient temperature in °C

        Returns:
            Dict with charging recommendations
        """
        # Calculate energy needed
        energy_needed_kwh = (target_soc - current_soc) * battery_capacity_kwh

        # Temperature-based recommendations
        if ambient_temp_celsius > self.hot_temp_threshold:
            recommended_power = self.max_charging_power_kw * self.hot_derate_factor
            notes = "High ambient temperature detected. Charging power will be derated to prevent thermal stress."
        elif ambient_temp_celsius < self.cold_temp_threshold:
            recommended_power = self.max_charging_power_kw * self.cold_derate_factor
            notes = "Low ambient temperature detected. Charging power will be derated for optimal performance."
        else:
            recommended_power = self.max_charging_power_kw
            notes = "Ambient temperature is optimal for charging."

        # SOC-based recommendations
        if current_soc > 0.8:
            notes += " Battery is nearing full charge. Charging power will taper automatically."

        return {
            "recommended_max_power_kW": round(recommended_power, 1),
            "energy_needed_kWh": round(energy_needed_kwh, 2),
            "estimated_efficiency_percent": 90.0,
            "notes": notes,
            "thermal_considerations": {
                "cooling_activates_above_celsius": self.cooling_threshold_temp,
                "optimal_temp_range_celsius": "20-30"
            }
        }