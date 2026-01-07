db = db.getSiblingDB('field_service_manager');

db.createUser({
  user: 'fsm_user',
  pwd: 'fsm_password',
  roles: [
    {
      role: 'readWrite',
      db: 'field_service_manager'
    }
  ]
});

db.createCollection('customers');
db.createCollection('technicians');
db.createCollection('working_hours');
db.createCollection('service_appointments');
db.createCollection('skills');
db.createCollection('work_areas');