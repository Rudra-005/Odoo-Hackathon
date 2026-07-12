"""
Comprehensive seed script for TransitOps Fleet Management ERP.
Creates 50+ vehicles, 30 drivers, trips, fuel logs, maintenance records, expenses.
All data is realistic with proper Indian vehicle names and registration numbers.
"""
import os
import sys
import django
import random
from decimal import Decimal
from datetime import date, timedelta, datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from apps.common.models import Company, Region
from apps.vehicles.models import VehicleType, Vehicle
from apps.drivers.models import Driver, DriverLicense
from apps.trips.models import Trip
from apps.maintenance.models import MaintenanceType, MaintenanceLog
from apps.fuel.models import FuelLog
from apps.expenses.models import ExpenseCategory, Expense

print("=" * 60)
print("  TransitOps — Seeding Database with Realistic Data")
print("=" * 60)

# ─────────────────────────────────────────────────────────────
# 1. COMPANY & REGIONS
# ─────────────────────────────────────────────────────────────
company, _ = Company.objects.get_or_create(
    name="TransitOps Logistics Pvt. Ltd.",
    defaults={
        'gst_number': '27AABCT1234F1ZX',
        'address': '42 Industrial Area, Phase 2, Gurugram, Haryana 122001',
        'phone': '+91 124 456 7890',
        'email': 'admin@transitops.in',
        'website': 'https://transitops.in'
    }
)
print(f"✓ Company: {company.name}")

region_data = [
    ('North India', 'NORTH'), ('South India', 'SOUTH'), ('East India', 'EAST'),
    ('West India', 'WEST'), ('Central India', 'CENTRAL'), ('Northeast India', 'NE'),
]
regions = []
for name, code in region_data:
    r, _ = Region.objects.get_or_create(name=name, defaults={'code': code})
    regions.append(r)
print(f"✓ Regions: {len(regions)} created")

# ─────────────────────────────────────────────────────────────
# 2. VEHICLE TYPES
# ─────────────────────────────────────────────────────────────
type_names = ['TRUCK', 'MINI_TRUCK', 'PICKUP', 'VAN', 'BUS', 'TRAILER', 'OTHER']
vtypes = {}
for t in type_names:
    vt, _ = VehicleType.objects.get_or_create(name=t, defaults={'description': f'{t} vehicle type'})
    vtypes[t] = vt
print(f"✓ Vehicle Types: {len(vtypes)}")

# ─────────────────────────────────────────────────────────────
# 3. VEHICLES — 55 realistic vehicles across categories
# ─────────────────────────────────────────────────────────────
vehicles_data = [
    # TRUCKS (20)
    ('Tata Prima 4928.S', 'Tata Motors', 'Prima 4928.S', 'TRUCK', 'DIESEL', 28000, 2023),
    ('Ashok Leyland 4825', 'Ashok Leyland', '4825 HG', 'TRUCK', 'DIESEL', 25000, 2022),
    ('BharatBenz 3523R', 'BharatBenz', '3523R', 'TRUCK', 'DIESEL', 23000, 2023),
    ('Volvo FM 420', 'Volvo Trucks', 'FM 420 8x2', 'TRUCK', 'DIESEL', 35000, 2024),
    ('Eicher Pro 6049', 'Eicher Motors', 'Pro 6049', 'TRUCK', 'DIESEL', 31000, 2022),
    ('Tata Signa 4825.TK', 'Tata Motors', 'Signa 4825.TK', 'TRUCK', 'DIESEL', 25000, 2023),
    ('Ashok Leyland AVTR 3120', 'Ashok Leyland', 'AVTR 3120', 'TRUCK', 'DIESEL', 20000, 2024),
    ('Mahindra Blazo X 35', 'Mahindra', 'Blazo X 35', 'TRUCK', 'DIESEL', 35000, 2023),
    ('Scania P410', 'Scania', 'P410 8x2', 'TRUCK', 'DIESEL', 40000, 2024),
    ('Tata LPT 3718', 'Tata Motors', 'LPT 3718', 'TRUCK', 'DIESEL', 18000, 2021),
    ('Ashok Leyland Captain 3518', 'Ashok Leyland', 'Captain 3518', 'TRUCK', 'DIESEL', 18000, 2022),
    ('BharatBenz 4228R', 'BharatBenz', '4228R', 'TRUCK', 'DIESEL', 28000, 2023),
    ('Volvo FMX 460', 'Volvo Trucks', 'FMX 460', 'TRUCK', 'DIESEL', 42000, 2024),
    ('Eicher Pro 6041', 'Eicher Motors', 'Pro 6041', 'TRUCK', 'DIESEL', 25000, 2023),
    ('Tata Ultra T.16 S', 'Tata Motors', 'Ultra T.16 S', 'TRUCK', 'DIESEL', 16000, 2022),
    ('MAN CLA 31.300 EVO', 'MAN Trucks', 'CLA 31.300 EVO', 'TRUCK', 'DIESEL', 31000, 2023),
    ('Daimler India 2523C', 'Daimler India', '2523C', 'TRUCK', 'DIESEL', 23000, 2022),
    ('Ashok Leyland U-3123T', 'Ashok Leyland', 'U-3123T', 'TRUCK', 'DIESEL', 31000, 2024),
    ('Tata Signa 3518.T', 'Tata Motors', 'Signa 3518.T', 'TRUCK', 'DIESEL', 18000, 2023),
    ('Eicher Pro 6055', 'Eicher Motors', 'Pro 6055', 'TRUCK', 'DIESEL', 37000, 2024),
    # MINI TRUCKS (10)
    ('Tata Ace Gold', 'Tata Motors', 'Ace Gold', 'MINI_TRUCK', 'DIESEL', 750, 2023),
    ('Mahindra Bolero Pickup', 'Mahindra', 'Bolero Pickup FB', 'MINI_TRUCK', 'DIESEL', 1700, 2022),
    ('Ashok Leyland Dost+', 'Ashok Leyland', 'Dost+ Strong', 'MINI_TRUCK', 'DIESEL', 2100, 2023),
    ('Tata Intra V30', 'Tata Motors', 'Intra V30', 'MINI_TRUCK', 'DIESEL', 1500, 2024),
    ('Mahindra Supro Profit Truck', 'Mahindra', 'Supro Profit Truck', 'MINI_TRUCK', 'DIESEL', 1000, 2023),
    ('Maruti Super Carry', 'Maruti Suzuki', 'Super Carry', 'MINI_TRUCK', 'CNG', 740, 2022),
    ('Tata Yodha 2.0', 'Tata Motors', 'Yodha 2.0 Pickup', 'MINI_TRUCK', 'DIESEL', 2050, 2024),
    ('Piaggio Ape Xtra Dlx', 'Piaggio', 'Ape Xtra Dlx', 'MINI_TRUCK', 'CNG', 500, 2023),
    ('Eicher Pro 2049', 'Eicher Motors', 'Pro 2049', 'MINI_TRUCK', 'DIESEL', 5000, 2022),
    ('Force Shaktiman 200', 'Force Motors', 'Shaktiman 200', 'MINI_TRUCK', 'DIESEL', 2000, 2023),
    # PICKUPS (5)
    ('Tata Xenon Yodha', 'Tata Motors', 'Xenon Yodha', 'PICKUP', 'DIESEL', 1250, 2023),
    ('Mahindra Bolero Camper', 'Mahindra', 'Bolero Camper Gold ZX', 'PICKUP', 'DIESEL', 1300, 2022),
    ('Isuzu D-Max V-Cross', 'Isuzu', 'D-Max V-Cross Z', 'PICKUP', 'DIESEL', 1045, 2024),
    ('Toyota Hilux', 'Toyota', 'Hilux 4x4 AT', 'PICKUP', 'DIESEL', 1065, 2024),
    ('Tata Yodha 4x4', 'Tata Motors', 'Yodha 4x4 Crew Cab', 'PICKUP', 'DIESEL', 1500, 2023),
    # VANS (8)
    ('Tata Winger 15 Seater', 'Tata Motors', 'Winger 15 S', 'VAN', 'DIESEL', 1500, 2023),
    ('Force Traveller 3700', 'Force Motors', 'Traveller 3700', 'VAN', 'DIESEL', 2500, 2022),
    ('Maruti Eeco Cargo', 'Maruti Suzuki', 'Eeco Cargo', 'VAN', 'CNG', 500, 2023),
    ('Mahindra Supro Van', 'Mahindra', 'Supro Van', 'VAN', 'DIESEL', 600, 2024),
    ('Force Urbania', 'Force Motors', 'Urbania 17 Seater', 'VAN', 'DIESEL', 2000, 2024),
    ('Toyota HiAce', 'Toyota', 'HiAce 3.0', 'VAN', 'DIESEL', 1250, 2024),
    ('Tata Magic Express', 'Tata Motors', 'Magic Express', 'VAN', 'DIESEL', 1000, 2022),
    ('Ashok Leyland Stile', 'Ashok Leyland', 'Stile LS', 'VAN', 'DIESEL', 800, 2023),
    # BUSES (8)
    ('Tata Starbus Ultra', 'Tata Motors', 'Starbus Ultra AC', 'BUS', 'DIESEL', 7000, 2023),
    ('Ashok Leyland Viking', 'Ashok Leyland', 'Viking City', 'BUS', 'DIESEL', 6500, 2022),
    ('Volvo 9600', 'Volvo Buses', '9600 Multi-Axle', 'BUS', 'DIESEL', 8000, 2024),
    ('BharatBenz 1624', 'BharatBenz', '1624 Bus', 'BUS', 'DIESEL', 5500, 2023),
    ('Eicher Skyline Pro 6016', 'Eicher Motors', 'Skyline Pro 6016', 'BUS', 'DIESEL', 6000, 2024),
    ('Tata Starbus EV 12m', 'Tata Motors', 'Starbus EV 12m', 'BUS', 'ELECTRIC', 5000, 2024),
    ('Switch EiV 12', 'Switch Mobility', 'EiV 12', 'BUS', 'ELECTRIC', 5500, 2024),
    ('Ashok Leyland BOSS 1412', 'Ashok Leyland', 'BOSS 1412', 'BUS', 'DIESEL', 5000, 2023),
    # TRAILERS (4)
    ('Tata 4018 Trailer', 'Tata Motors', '4018 Tractor-Trailer', 'TRAILER', 'DIESEL', 40000, 2022),
    ('Ashok Leyland 4923 TT', 'Ashok Leyland', '4923 Tractor-Trailer', 'TRAILER', 'DIESEL', 42000, 2023),
    ('Volvo FM 460 Puller', 'Volvo Trucks', 'FM 460 Puller', 'TRAILER', 'DIESEL', 45000, 2024),
    ('BharatBenz 5528T', 'BharatBenz', '5528T Tractor', 'TRAILER', 'DIESEL', 48000, 2024),
]

states = ['DL', 'HR', 'UP', 'MH', 'KA', 'TN', 'GJ', 'RJ', 'MP', 'WB', 'PB', 'AP']
statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'ON_TRIP', 'MAINTENANCE']  # weighted

vehicles = []
for i, (name, mfr, model, vtype, fuel, cap, year) in enumerate(vehicles_data):
    reg_state = random.choice(states)
    reg_num = f"{reg_state} {random.randint(1,99):02d} {random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')}{random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')} {random.randint(1000,9999)}"
    vin = f"IN{mfr[:3].upper()}{random.randint(10000000, 99999999)}{year}"
    
    v, created = Vehicle.objects.get_or_create(
        registration_number=reg_num,
        defaults={
            'company': company,
            'region': random.choice(regions),
            'vehicle_type': vtypes[vtype],
            'vin_number': vin,
            'vehicle_name': name,
            'model': model,
            'manufacturer': mfr,
            'year': year,
            'maximum_load_capacity': Decimal(str(cap)),
            'current_odometer': Decimal(str(random.randint(5000, 250000))),
            'fuel_type': fuel,
            'acquisition_cost': Decimal(str(random.randint(400000, 8000000))),
            'purchase_date': date(year, random.randint(1, 12), random.randint(1, 28)),
            'insurance_number': f'INS-{random.randint(100000, 999999)}',
            'insurance_expiry': date.today() + timedelta(days=random.randint(30, 365)),
            'fitness_expiry': date.today() + timedelta(days=random.randint(60, 730)),
            'status': random.choice(statuses),
        }
    )
    vehicles.append(v)

print(f"✓ Vehicles: {len(vehicles)} created/loaded")

# ─────────────────────────────────────────────────────────────
# 4. DRIVERS — 30 realistic Indian drivers
# ─────────────────────────────────────────────────────────────
driver_data = [
    ('Rajesh', 'Kumar', 'MALE', 'B+'), ('Sunil', 'Yadav', 'MALE', 'O+'),
    ('Amit', 'Singh', 'MALE', 'A+'), ('Pradeep', 'Sharma', 'MALE', 'AB+'),
    ('Vikram', 'Chauhan', 'MALE', 'O-'), ('Ravi', 'Verma', 'MALE', 'B-'),
    ('Manoj', 'Tiwari', 'MALE', 'A-'), ('Deepak', 'Gupta', 'MALE', 'B+'),
    ('Arun', 'Patel', 'MALE', 'O+'), ('Naveen', 'Joshi', 'MALE', 'A+'),
    ('Sanjay', 'Mishra', 'MALE', 'AB-'), ('Ramesh', 'Prasad', 'MALE', 'B+'),
    ('Gopal', 'Das', 'MALE', 'O+'), ('Vinod', 'Pandey', 'MALE', 'A+'),
    ('Ashok', 'Mehta', 'MALE', 'AB+'), ('Kiran', 'Reddy', 'MALE', 'O+'),
    ('Suresh', 'Nair', 'MALE', 'B+'), ('Harish', 'Pillai', 'MALE', 'A-'),
    ('Mohan', 'Rawat', 'MALE', 'O-'), ('Dinesh', 'Choudhary', 'MALE', 'B-'),
    ('Lakshmi', 'Devi', 'FEMALE', 'A+'), ('Sunita', 'Kumari', 'FEMALE', 'O+'),
    ('Pooja', 'Rathore', 'FEMALE', 'B+'), ('Anita', 'Jha', 'FEMALE', 'AB+'),
    ('Prakash', 'Sahu', 'MALE', 'O+'), ('Ganesh', 'Patil', 'MALE', 'A+'),
    ('Jagdish', 'Thakur', 'MALE', 'B-'), ('Balram', 'Pal', 'MALE', 'O-'),
    ('Santosh', 'Dubey', 'MALE', 'AB+'), ('Rakesh', 'Agarwal', 'MALE', 'B+'),
]

cities = ['Delhi', 'Gurugram', 'Noida', 'Lucknow', 'Jaipur', 'Mumbai', 'Pune', 'Chandigarh', 'Ahmedabad', 'Kolkata']
driver_statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'ON_TRIP', 'OFF_DUTY']

drivers = []
for i, (fn, ln, gender, bg) in enumerate(driver_data):
    code = f"DRV-{i+1:04d}"
    city = random.choice(cities)
    phone = f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}"
    
    d, created = Driver.objects.get_or_create(
        driver_code=code,
        defaults={
            'company': company,
            'first_name': fn,
            'last_name': ln,
            'gender': gender,
            'dob': date(random.randint(1975, 1998), random.randint(1, 12), random.randint(1, 28)),
            'blood_group': bg,
            'email': f"{fn.lower()}.{ln.lower()}@transitops.in",
            'phone': phone,
            'address': f'{random.randint(1, 500)}, Sector {random.randint(1, 60)}, {city}',
            'city': city,
            'state': 'Haryana' if city == 'Gurugram' else city,
            'country': 'India',
            'pincode': f'{random.randint(110001, 400099)}',
            'joining_date': date.today() - timedelta(days=random.randint(90, 2000)),
            'experience': random.randint(2, 20),
            'emergency_contact_name': f'{random.choice(["Sunita", "Meera", "Geeta", "Radha"])} {ln}',
            'emergency_contact_number': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'safety_score': Decimal(str(round(random.uniform(70, 100), 2))),
            'salary': Decimal(str(random.randint(18000, 45000))),
            'status': random.choice(driver_statuses),
        }
    )
    drivers.append(d)
    
    # Create driver license
    if created:
        lic_cats = ['LMV', 'HMV', 'TRANSPORT', 'HGMV']
        DriverLicense.objects.get_or_create(
            driver=d,
            defaults={
                'license_number': f'DL-{random.randint(1000, 9999)}-{random.randint(2015, 2024)}-{random.randint(100000, 999999)}',
                'license_category': random.choice(lic_cats),
                'license_issue_date': date.today() - timedelta(days=random.randint(365, 3650)),
                'license_expiry': date.today() + timedelta(days=random.randint(180, 1800)),
                'license_authority': random.choice(['RTO Delhi', 'RTO Gurugram', 'RTO Mumbai', 'RTO Lucknow', 'RTO Jaipur']),
            }
        )

print(f"✓ Drivers: {len(drivers)} created/loaded")

# ─────────────────────────────────────────────────────────────
# 5. TRIPS — 80 trips across last 6 months
# ─────────────────────────────────────────────────────────────
routes = [
    ('Delhi', 'Mumbai', 1400), ('Delhi', 'Kolkata', 1500), ('Delhi', 'Chennai', 2200),
    ('Mumbai', 'Pune', 150), ('Delhi', 'Jaipur', 280), ('Delhi', 'Lucknow', 555),
    ('Mumbai', 'Ahmedabad', 530), ('Bangalore', 'Chennai', 350), ('Delhi', 'Chandigarh', 250),
    ('Kolkata', 'Patna', 570), ('Jaipur', 'Udaipur', 395), ('Delhi', 'Dehradun', 250),
    ('Mumbai', 'Goa', 590), ('Hyderabad', 'Bangalore', 570), ('Delhi', 'Agra', 230),
    ('Lucknow', 'Varanasi', 320), ('Ahmedabad', 'Surat', 265), ('Pune', 'Nashik', 210),
    ('Chennai', 'Coimbatore', 510), ('Delhi', 'Amritsar', 450),
]

cargo_types = ['Electronics', 'FMCG', 'Textiles', 'Machinery', 'Chemicals', 'Agriculture', 
               'Furniture', 'Pharmaceuticals', 'Building Materials', 'Auto Parts',
               'Food Grains', 'Petroleum Products', 'Steel Coils']

trip_statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'DISPATCHED', 'DRAFT']

trips = []
for i in range(80):
    src, dst, dist = random.choice(routes)
    veh = random.choice(vehicles)
    drv = random.choice(drivers)
    trip_status = random.choice(trip_statuses)
    days_ago = random.randint(1, 180)
    start = timezone.now() - timedelta(days=days_ago)
    
    actual_dist = dist + random.randint(-30, 50) if trip_status == 'COMPLETED' else None
    rev = Decimal(str(random.randint(8000, 120000))) if trip_status == 'COMPLETED' else Decimal('0')
    fuel = Decimal(str(round(dist / random.uniform(3.5, 6.5), 2))) if trip_status == 'COMPLETED' else None
    
    trip_num = f"TRP-{date.today().year}-{i+1:05d}"
    
    t, created = Trip.objects.get_or_create(
        trip_number=trip_num,
        defaults={
            'company': company,
            'source': src,
            'destination': dst,
            'region': random.choice(regions),
            'vehicle': veh,
            'driver': drv,
            'cargo_type': random.choice(cargo_types),
            'cargo_description': f'Shipment of {random.choice(cargo_types).lower()} goods',
            'cargo_weight': Decimal(str(random.randint(500, 25000))),
            'planned_distance': Decimal(str(dist)),
            'actual_distance': Decimal(str(actual_dist)) if actual_dist else None,
            'estimated_duration': Decimal(str(round(dist / 50, 2))),
            'actual_duration': Decimal(str(round(dist / random.uniform(40, 55), 2))) if trip_status == 'COMPLETED' else None,
            'revenue': rev,
            'fuel_consumed': fuel,
            'start_odometer': veh.current_odometer,
            'end_odometer': veh.current_odometer + Decimal(str(dist)) if trip_status == 'COMPLETED' else None,
            'customer_name': random.choice(['Reliance Industries', 'Tata Group', 'Flipkart', 'Amazon India', 'BigBasket', 'Hindustan Unilever', 'ITC Limited', 'Maruti Suzuki', 'Adani Logistics', 'Delhivery']),
            'customer_contact': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'dispatch_date': start,
            'start_time': start + timedelta(hours=random.randint(1, 5)),
            'arrival_date': start + timedelta(hours=int(dist / 45)) if trip_status == 'COMPLETED' else None,
            'completion_date': start + timedelta(hours=int(dist / 45) + random.randint(1, 5)) if trip_status == 'COMPLETED' else None,
            'status': trip_status,
        }
    )
    trips.append(t)

print(f"✓ Trips: {len(trips)} created/loaded")

# ─────────────────────────────────────────────────────────────
# 6. MAINTENANCE TYPES & LOGS — 50 maintenance records
# ─────────────────────────────────────────────────────────────
maint_type_names = ['OIL_CHANGE', 'TYRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR',
                     'BATTERY_REPLACEMENT', 'CLUTCH', 'GEARBOX', 'SUSPENSION',
                     'AC_SERVICE', 'ELECTRICAL', 'GENERAL_SERVICE', 'ACCIDENT_REPAIR']
maint_types = {}
for mt_name in maint_type_names:
    mt, _ = MaintenanceType.objects.get_or_create(name=mt_name, defaults={'description': f'{mt_name} maintenance type'})
    maint_types[mt_name] = mt
print(f"✓ Maintenance Types: {len(maint_types)}")

workshops = ['AutoFix Service Center', 'SpeedoMech Garage', 'Krishna Motors Workshop', 
             'RoadKing Service Station', 'Shree Balaji Auto Works', 'National Automobiles',
             'Jain Brothers Garage', 'Highway Auto Repair']

issues = [
    'Engine overheating during long hauls', 'Brake pads worn out', 'Oil leak from gasket',
    'Battery not charging properly', 'Clutch slipping at high RPM', 'AC not cooling',
    'Gearbox noise during shifting', 'Suspension creaking on bad roads',
    'Electrical short circuit in dashboard', 'Tyre puncture on highway',
    'Routine 10K km service', 'Front axle misalignment', 'Exhaust system corrosion',
    'Radiator coolant leak', 'Power steering fluid low', 'Windshield wiper motor failure',
]

maint_statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'SCHEDULED']
priorities = ['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL']

maintenance_logs = []
for i in range(50):
    veh = random.choice(vehicles)
    mt = random.choice(list(maint_types.values()))
    days_ago = random.randint(1, 180)
    start = date.today() - timedelta(days=days_ago)
    est_cost = Decimal(str(random.randint(2000, 80000)))
    m_status = random.choice(maint_statuses)
    
    ml, created = MaintenanceLog.objects.get_or_create(
        maintenance_id=f"MNT-{date.today().year}-{i+1:05d}",
        defaults={
            'company': company,
            'vehicle': veh,
            'maintenance_type': mt,
            'workshop': random.choice(workshops),
            'vendor': random.choice(['Bosch', 'Castrol', 'MRF', 'CEAT', 'Exide', 'Amaron', 'Shell', 'Mobil']),
            'mechanic_name': f'{random.choice(["Ramu", "Shyam", "Gopal", "Hari", "Mohan"])} {random.choice(["Lal", "Kumar", "Prasad", "Das", "Singh"])}',
            'mechanic_contact': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'issue': random.choice(issues),
            'diagnosis': 'Detailed inspection completed. Parts identified for replacement.',
            'description': 'Maintenance work carried out as per standard operating procedure.',
            'priority': random.choice(priorities),
            'estimated_cost': est_cost,
            'actual_cost': est_cost + Decimal(str(random.randint(-2000, 5000))) if m_status == 'COMPLETED' else Decimal('0'),
            'start_date': start,
            'estimated_completion': start + timedelta(days=random.randint(1, 7)),
            'actual_completion': start + timedelta(days=random.randint(1, 5)) if m_status == 'COMPLETED' else None,
            'parts_used': random.choice(['Oil filter, Engine oil 5L', 'Brake pads x4, Brake fluid', 'Battery 12V, Terminals', 'Tyre x2, Alignment kit', 'Clutch plate, Pressure plate']),
            'warranty': f'{random.choice([3, 6, 12])} months',
            'status': m_status,
        }
    )
    maintenance_logs.append(ml)

print(f"✓ Maintenance Logs: {len(maintenance_logs)} created/loaded")

# ─────────────────────────────────────────────────────────────
# 7. FUEL LOGS — 100 fuel entries
# ─────────────────────────────────────────────────────────────
fuel_stations = ['Indian Oil - Sector 44', 'Bharat Petroleum - NH8', 'HP Petrol Pump - GT Road',
                  'Reliance Petroleum - Ring Road', 'Shell - MG Road', 'Essar Oil - Highway 48',
                  'Indian Oil - Manesar', 'BPCL - Mathura Road', 'HPCL - Dwarka Expressway']

fuel_logs = []
for i in range(100):
    veh = random.choice(vehicles)
    drv = random.choice(drivers)
    days_ago = random.randint(1, 180)
    qty = Decimal(str(round(random.uniform(20, 350), 2)))
    ppu = Decimal(str(round(random.uniform(85, 105), 2))) if veh.fuel_type == 'DIESEL' else Decimal(str(round(random.uniform(95, 115), 2)))
    total = round(qty * ppu, 2)
    
    fl, created = FuelLog.objects.get_or_create(
        fuel_log_number=f"FL-{date.today().year}-{i+1:05d}",
        defaults={
            'company': company,
            'vehicle': veh,
            'driver': drv,
            'fuel_station': random.choice(fuel_stations),
            'fuel_vendor': random.choice(['IOCL', 'BPCL', 'HPCL', 'Shell', 'Reliance']),
            'fuel_type': veh.fuel_type,
            'quantity': qty,
            'price_per_unit': ppu,
            'total_cost': Decimal(str(total)),
            'odometer_reading': veh.current_odometer + Decimal(str(random.randint(100, 5000))),
            'distance_since_last': Decimal(str(random.randint(200, 800))),
            'fuel_efficiency': Decimal(str(round(random.uniform(2.5, 8.0), 2))),
            'payment_method': random.choice(['CASH', 'CARD', 'UPI', 'COMPANY_ACCOUNT']),
            'invoice_number': f'INV-{random.randint(100000, 999999)}',
            'fuel_date': date.today() - timedelta(days=days_ago),
        }
    )
    fuel_logs.append(fl)

print(f"✓ Fuel Logs: {len(fuel_logs)} created/loaded")

# ─────────────────────────────────────────────────────────────
# 8. EXPENSE CATEGORIES & EXPENSES — 120 expense records
# ─────────────────────────────────────────────────────────────
cat_names = ['FUEL', 'MAINTENANCE', 'PARKING', 'TOLL', 'INSURANCE', 'REPAIR',
             'SALARY', 'FINE', 'CLEANING', 'PERMIT', 'TAX', 'MISC']
categories = {}
for cn in cat_names:
    cat, _ = ExpenseCategory.objects.get_or_create(name=cn, defaults={'description': f'{cn} expenses'})
    categories[cn] = cat
print(f"✓ Expense Categories: {len(categories)}")

expense_statuses = ['APPROVED', 'APPROVED', 'APPROVED', 'PAID', 'PENDING']
payment_methods = ['CASH', 'BANK_TRANSFER', 'UPI', 'COMPANY_WALLET', 'CHEQUE']

vendors = ['Indian Oil Corporation', 'Bharat Petroleum', 'NHAI Toll', 'MRF Tyres', 'Bosch Service',
           'ICICI Lombard Insurance', 'FASTag Recharge', 'Quick Wash Services',
           'State RTO', 'Municipal Corporation', 'AutoZone Parts', 'CEAT Tyres']

expenses = []
for i in range(120):
    cat_key = random.choice(list(categories.keys()))
    cat = categories[cat_key]
    veh = random.choice(vehicles)
    drv = random.choice(drivers)
    days_ago = random.randint(1, 180)
    amount = Decimal(str(random.randint(500, 80000)))
    tax_amt = round(amount * Decimal('0.18'), 2) if cat_key in ['MAINTENANCE', 'REPAIR', 'INSURANCE'] else Decimal('0')
    discount = Decimal(str(random.randint(0, 500)))
    net = amount + tax_amt - discount
    
    exp_status = random.choice(expense_statuses)
    
    exp, created = Expense.objects.get_or_create(
        expense_number=f"EXP-{date.today().year}-{i+1:05d}",
        defaults={
            'company': company,
            'vehicle': veh,
            'driver': drv,
            'category': cat,
            'vendor': random.choice(vendors),
            'vendor_contact': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
            'invoice_number': f'INV-EXP-{random.randint(100000, 999999)}',
            'expense_date': date.today() - timedelta(days=days_ago),
            'amount': amount,
            'tax': tax_amt,
            'discount': discount,
            'net_amount': net,
            'payment_method': random.choice(payment_methods),
            'description': f'{cat.get_name_display()} expense for {veh.registration_number}',
            'status': exp_status,
        }
    )
    expenses.append(exp)

print(f"✓ Expenses: {len(expenses)} created/loaded")

# ─────────────────────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  ✅ DATABASE SEEDING COMPLETE!")
print("=" * 60)
print(f"  Companies:          {Company.objects.count()}")
print(f"  Regions:            {Region.objects.count()}")
print(f"  Vehicle Types:      {VehicleType.objects.count()}")
print(f"  Vehicles:           {Vehicle.objects.count()}")
print(f"  Drivers:            {Driver.objects.count()}")
print(f"  Driver Licenses:    {DriverLicense.objects.count()}")
print(f"  Trips:              {Trip.objects.count()}")
print(f"  Maintenance Types:  {MaintenanceType.objects.count()}")
print(f"  Maintenance Logs:   {MaintenanceLog.objects.count()}")
print(f"  Fuel Logs:          {FuelLog.objects.count()}")
print(f"  Expense Categories: {ExpenseCategory.objects.count()}")
print(f"  Expenses:           {Expense.objects.count()}")
print("=" * 60)
