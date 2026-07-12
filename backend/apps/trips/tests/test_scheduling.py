from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta

from apps.common.models import Company, Region
from apps.vehicles.models import Vehicle, VehicleType
from apps.drivers.models import Driver, DriverLicense
from apps.trips.models import Trip
from apps.maintenance.models import MaintenanceLog, MaintenanceType
from apps.trips.services import create_trip, dispatch_trip, complete_trip
from apps.trips.scheduling import SchedulingEngine


class SchedulingEngineTestCase(TestCase):
    def setUp(self):
        # Setup basic data
        self.company = Company.objects.create(name="Test Logistics")
        self.region = Region.objects.create(name="North Region", code="NR")
        
        self.vehicle_type = VehicleType.objects.create(name="Heavy Truck", description="HV")
        self.vehicle = Vehicle.objects.create(
            company=self.company,
            region=self.region,
            vehicle_type=self.vehicle_type,
            registration_number="DL 01 AA 1111",
            vehicle_name="Ashok Leyland 4020",
            vin_number="VIN1234567890",
            model="4020",
            manufacturer="Ashok Leyland",
            year=2022,
            fuel_type="DIESEL",
            maximum_load_capacity=10000.00,
            current_odometer=5000.00,
            status="AVAILABLE"
        )
        
        self.driver = Driver.objects.create(
            company=self.company,
            driver_code="DRV-001",
            first_name="Rudra",
            last_name="Singh",
            phone="9876543210",
            status="AVAILABLE",
            safety_score=95.00
        )
        
        # Valid license (expiry in future)
        self.license = DriverLicense.objects.create(
            driver=self.driver,
            license_number="DL-12345",
            license_category="TRANSPORT",
            license_expiry=timezone.now().date() + timedelta(days=365)
        )
        
        self.now = timezone.now()

    def test_trip_time_validation(self):
        """End <= Start should fail."""
        start = self.now + timedelta(hours=2)
        end = self.now + timedelta(hours=1)
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_trip_timing(start, end)
        self.assertIn("End time must be after start time", str(ctx.exception))

    def test_past_date_validation(self):
        """Planned start in the past should fail."""
        past_start = self.now - timedelta(hours=1)
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_past_date(past_start)
        self.assertIn("Planned start time cannot be in the past", str(ctx.exception))

    def test_cargo_capacity_validation(self):
        """Weight > vehicle capacity should fail."""
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_cargo_capacity(self.vehicle, 12000.00)
        self.assertIn("Cargo exceeds vehicle capacity", str(ctx.exception))

    def test_license_expiry_validation(self):
        """Expired license should fail validation."""
        self.license.license_expiry = timezone.now().date() - timedelta(days=1)
        self.license.save()
        
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_license_validity(self.driver)
        self.assertIn("Driver license has expired", str(ctx.exception))

    def test_vehicle_overlap_collision(self):
        """Conflicting vehicle booking times should fail."""
        # Create an existing trip: 10:00 to 14:00
        start1 = self.now + timedelta(hours=10)
        end1 = self.now + timedelta(hours=14)
        Trip.objects.create(
            company=self.company,
            trip_number="TRP-1001",
            source="A", destination="B",
            vehicle=self.vehicle, driver=self.driver,
            planned_start_time=start1, planned_end_time=end1,
            status="DRAFT"
        )
        
        # Try booking 12:00 to 16:00 (overlaps)
        start2 = self.now + timedelta(hours=12)
        end2 = self.now + timedelta(hours=16)
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_vehicle_collision(self.vehicle, start2, end2)
        self.assertIn("Vehicle is already booked during this time", str(ctx.exception))

    def test_driver_overlap_collision(self):
        """Conflicting driver booking times should fail."""
        # Create an existing trip: 10:00 to 14:00
        start1 = self.now + timedelta(hours=10)
        end1 = self.now + timedelta(hours=14)
        Trip.objects.create(
            company=self.company,
            trip_number="TRP-1001",
            source="A", destination="B",
            vehicle=self.vehicle, driver=self.driver,
            planned_start_time=start1, planned_end_time=end1,
            status="DRAFT"
        )
        
        # Try booking 12:00 to 16:00 (overlaps)
        start2 = self.now + timedelta(hours=12)
        end2 = self.now + timedelta(hours=16)
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_driver_collision(self.driver, start2, end2)
        self.assertIn("Driver is already assigned to another trip during this time", str(ctx.exception))

    def test_maintenance_overlap_collision(self):
        """Vehicle booked during active maintenance should fail."""
        m_type = MaintenanceType.objects.create(name="ENGINE_REPAIR")
        
        # Maintenance: 09:00 to 17:00
        m_start = self.now + timedelta(hours=9)
        m_end = self.now + timedelta(hours=17)
        MaintenanceLog.objects.create(
            company=self.company,
            vehicle=self.vehicle,
            maintenance_type=m_type,
            maintenance_start=m_start,
            maintenance_end=m_end,
            status="ACTIVE"
        )
        
        # Try booking trip: 12:00 to 14:00
        t_start = self.now + timedelta(hours=12)
        t_end = self.now + timedelta(hours=14)
        with self.assertRaises(ValidationError) as ctx:
            SchedulingEngine.check_maintenance_collision(self.vehicle, t_start, t_end)
        self.assertIn("Vehicle is currently under maintenance", str(ctx.exception))

    def test_successful_dispatch_and_restoration(self):
        """A complete lifecycle test: dispatch -> complete -> resource status restoration."""
        t_start = self.now + timedelta(hours=2)
        t_end = self.now + timedelta(hours=5)
        trip = Trip.objects.create(
            company=self.company,
            trip_number="TRP-2001",
            source="Delhi", destination="Jaipur",
            vehicle=self.vehicle, driver=self.driver,
            planned_start_time=t_start, planned_end_time=t_end,
            cargo_weight=5000.00,
            status="DRAFT"
        )
        
        # Dispatch
        dispatch_trip(trip=trip, user=None)
        
        # Vehicle and Driver should be ON_TRIP
        self.vehicle.refresh_from_db()
        self.driver.refresh_from_db()
        self.assertEqual(self.vehicle.status, "ON_TRIP")
        self.assertEqual(self.driver.status, "ON_TRIP")
        
        # Complete
        complete_trip(trip=trip, user=None, data={
            "actual_distance": 250.00,
            "actual_duration": 4.5,
            "start_odometer": 5000.00,
            "end_odometer": 5250.00,
            "fuel_consumed": 35.00
        })
        
        # Vehicle and Driver should be restored to AVAILABLE
        self.vehicle.refresh_from_db()
        self.driver.refresh_from_db()
        self.assertEqual(self.vehicle.status, "AVAILABLE")
        self.assertEqual(self.driver.status, "AVAILABLE")
        self.assertEqual(self.vehicle.current_odometer, 5250.00)
