import pool from '../src/config/database.js';
import env from '../src/config/env.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

// Additive only: no DELETE, TRUNCATE, schema changes, or migration mutations.
export function assertSeedEnvironment(config) {
  if (!['development', 'test'].includes(config.nodeEnv)) throw new Error('Seeding is allowed only in development/test; destructive resets are not supported.');
  if (!['localhost', '127.0.0.1', '::1'].includes(config.database.host)) throw new Error('Seeder requires a local MySQL host.');
  if (/prod|production/i.test(config.database.database)) throw new Error('Refusing a production-named database.');
}
const names = ['Ayesha Rahman','Tanvir Hasan','Nusrat Jahan','Farhan Ahmed','Sadika Islam','Mehedi Hossain','Raisa Chowdhury','Arif Mahmud','Sabrina Akter','Imran Kabir','Nabila Sultana','Shafiq Alam','Tahmina Haque','Rafiul Karim','Sumaiya Zaman','Rezaul Chowdhury','Shamima Begum','Kamal Uddin','Nadia Karim','Masud Rana','Fahmida Akter','Anisul Haque','Salma Rahman','Nafisa Ahmed','Adnan Islam'];
const areas = ['Gulshan','Banani','Dhanmondi','Uttara','Bashundhara','Mirpur','Mohammadpur','Badda','Farmgate','Motijheel'];
const amenities = [['wifi','Wi-Fi'],['parking','Parking'],['lift','Lift'],['generator','Generator'],['security','Security'],['cctv','CCTV'],['air_conditioning','Air Conditioning'],['furnished','Furnished'],['balcony','Balcony'],['gas','Gas'],['water_supply','Water Supply'],['rooftop_access','Rooftop Access']];
const photos = ['photo-1600585154340-be6161a56a0c','photo-1600607687920-4e2a09cf159d','photo-1600566753086-00f18fb6b3ea','photo-1600047509807-ba8f99d2cdde'];
let db, locked = false;
const lockName = `${env.database.database}:development_seed`;
try {
  assertSeedEnvironment(env);
  db = await pool.getConnection();
  const [[lock]] = await db.execute('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
  if (lock.acquired !== 1) throw new Error('Another seeder is running.');
  locked = true;
  const [[migration]] = await db.query('SELECT COUNT(*) AS n FROM schema_migrations');
  if (migration.n < 18) throw new Error('Run npm run migrate before seeding.');
  await db.beginTransaction();
  async function ensure(table, key, values) {
    const columns = Object.keys(key);
    const [rows] = await db.execute(`SELECT * FROM ${table} WHERE ${columns.map(c=>`${c} <=> ?`).join(' AND ')} LIMIT 1`, Object.values(key));
    if (rows.length) return rows[0];
    const data = {...key, ...values};
    const [result] = await db.execute(`INSERT INTO ${table} (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(()=>'?').join(',')})`, Object.values(data));
    return {...data, id: result.insertId};
  }
  const users = {renter:[],owner:[],admin:[]}; let nameIndex=0;
  for (const [role,count] of [['renter',15],['owner',8],['admin',2]]) {
    for(let i=1;i<=count;i++) {
      const email=`${role}${i}@rentnest.test`, username=`demo_${role}${i}`;
      const [existing] = await db.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email,username]);
      let user;
      if (existing.length) {
        user=existing[0];
        if(existing.length!==1 || user.email!==email || user.username!==username || user.role!==role || user.status!=='active' || user.deleted_at || !await verifyPassword(user.password_hash,'12345678')) throw new Error(`Demo account collision or changed account: ${email}. No existing account will be overwritten.`);
      } else user=await ensure('users',{email},{username,name:names[nameIndex],role,status:'active',phone:`01700${String(nameIndex+1).padStart(6,'0')}`,password_hash:await hashPassword('12345678')});
      nameIndex++; users[role].push(user);
      await ensure('user_preferences',{user_id:user.id},{});
    }
  }
  const amenityRows=[];
  for(const [code,display_name] of amenities) amenityRows.push(await ensure('amenities',{code},{display_name}));
  const properties=[];
  const [[clock]]=await db.query("SELECT DATE_FORMAT(CURRENT_DATE,'%Y-%m-%d') AS today");
  const day=(offset)=>new Date(Date.parse(`${clock.today}T00:00:00Z`)+offset*86400000).toISOString().slice(0,10);
  const stamp=(offset)=>`${day(offset)} 10:00:00`;
  for(let i=0;i<36;i++) {
    const owner=users.owner[i%8], type=['apartment','flat','studio','room','office','parking'][i%6];
    const status=i<29?'approved':i<33?'pending':i<35?'rejected':'draft';
    const rent=type==='parking'?3500:type==='room'?8500:15000+(i%12)*3500;
    const property=await ensure('properties',{owner_id:owner.id,title:`${areas[i%10]} ${type} — Demo ${String(i+1).padStart(2,'0')}`},{description:`Bright ${type} in ${areas[i%10]}, Dhaka, close to local shops and public transport. Fictional development listing for a RentNest classroom demonstration.`,location:`${areas[i%10]}, Dhaka`,property_type:type,monthly_rent:rent,deposit_amount:rent*2,size_sqft:type==='parking'?150:400+(i%9)*175,bedrooms:['office','parking'].includes(type)?0:1+i%4,bathrooms:type==='parking'?0:1+i%3,furnished:i%3!==0?1:0,bachelor_allowed:i%4!==0?1:0,family_allowed:1,moderation_status:status,is_available:i<26?1:0,available_from:day(-30),reviewed_by:['approved','rejected'].includes(status)?users.admin[i%2].id:null,reviewed_at:['approved','rejected'].includes(status)?stamp(-7):null,rejection_reason:status==='rejected'?'Please clarify the address and replace the incomplete listing photos.':null,created_at:stamp(-60+i)});
    properties.push(property);
    for(let j=0;j<2+i%3;j++) await ensure('property_images',{property_id:property.id,image_path:`https://images.unsplash.com/${photos[(i+j)%4]}?auto=format&fit=crop&w=1000&q=80`},{sort_order:j,is_primary:j===0?1:0});
    for(let j=0;j<amenityRows.length;j++) if((i+j)%3===0 && (amenityRows[j].code!=='furnished'||property.furnished)) await ensure('property_amenities',{property_id:property.id,amenity_id:amenityRows[j].id},{});
  }
  for(let i=0;i<15;i++) for(let j=0;j<(i===0?5:i%9);j++) await ensure('favorites',{user_id:users.renter[i].id,property_id:properties[(i*2+j)%26].id},{});
  for(let i=0;i<45;i++) {
    const property=properties[i%26], renter=users.renter[i%15], status=['pending','approved','confirmed','rejected','cancelled'][(i+Math.floor(i/15))%5];
    const start=10+Math.floor(i/26)*120, created=-15+i%10;
    const booking=await ensure('bookings',{booking_code:`RN-DEMO-${String(i+1).padStart(3,'0')}`},{property_id:property.id,renter_id:renter.id,start_date:day(start),end_date:day(start+90),monthly_rent_snapshot:property.monthly_rent,deposit_snapshot:property.deposit_amount,total_amount:Number(property.monthly_rent)*3+Number(property.deposit_amount),status,decision_by:['approved','confirmed','rejected'].includes(status)?property.owner_id:null,decision_at:['approved','confirmed','rejected'].includes(status)?stamp(created+1):null,decision_reason:status==='rejected'?'The requested tenancy does not match the owner requirements.':null,cancelled_by:status==='cancelled'?renter.id:null,cancelled_at:status==='cancelled'?stamp(created+1):null,cancellation_reason:status==='cancelled'?'Renter changed their moving plans.':null,created_at:stamp(created)});
    const stages=status==='confirmed'?['pending','approved','confirmed']:status==='pending'?['pending']:['pending',status];
    for(let j=0;j<stages.length;j++) await ensure('booking_events',{booking_id:booking.id,new_status:stages[j]},{previous_status:j?stages[j-1]:null,actor_id:j===0||['confirmed','cancelled'].includes(stages[j])?renter.id:property.owner_id,reason:j?'Demo booking status update':'Booking submitted',created_at:stamp(created+j)});
    for(const userId of [renter.id,property.owner_id]) await ensure('notifications',{user_id:userId,booking_id:booking.id,title:`Booking ${status}: ${booking.booking_code}`},{category:'booking',body:`${property.title}: your booking is ${status}.`,property_id:property.id,read_at:i%3===0?stamp(0):null,created_at:stamp(created+stages.length-1)});
    if(status==='confirmed') {
      await ensure('payments',{reference_code:`RN-DEMO-PAY-${i+1}`},{booking_id:booking.id,payer_id:renter.id,payee_id:property.owner_id,record_type:'charge',amount:booking.total_amount,status:'completed',transaction_at:stamp(created+3),notes:'Fictional demo payment; no money was transferred.',created_at:stamp(created+3)});
      await ensure('notifications',{user_id:renter.id,booking_id:booking.id,title:`Payment received: ${booking.booking_code}`},{category:'booking',body:'Your demo tenancy payment has been recorded.',property_id:property.id});
    }
    await ensure('activity_logs',{action:'demo.booking.seeded',target_type:'booking',target_id:booking.id},{actor_id:renter.id,outcome:status==='rejected'?'warning':'success',description:`Demo booking ${booking.booking_code}: ${status}`,created_at:stamp(created)});
  }
  for(let i=0;i<18;i++) {
    const property=properties[i%26], renter=users.renter[i%15];
    const conversation=await ensure('conversations',{property_id:property.id,renter_id:renter.id,owner_id:property.owner_id},{created_at:stamp(-3),updated_at:stamp(-1)});
    const texts=[`Assalamu alaikum. Is the ${property.property_type} in ${property.location} available for a viewing?`,'Wa alaikum assalam. Yes, you can visit on Friday afternoon.','Thank you. Are the service charges included in the monthly rent?','Water and security are included. Electricity is billed separately.'];
    for(let j=0;j<texts.length;j++) await ensure('messages',{conversation_id:conversation.id,sender_id:j%2?property.owner_id:renter.id,message_text:texts[j]},{sent_at:`${day(-2)} 1${j}:00:00`,delivered_at:`${day(-2)} 1${j}:01:00`,read_at:j<2?`${day(-2)} 1${j}:05:00`:null});
    await ensure('notifications',{user_id:renter.id,conversation_id:conversation.id,title:'New reply about your viewing'},{category:'message',body:'The owner replied to your property enquiry.',property_id:property.id,read_at:i%2?stamp(-1):null});
  }
  for(const property of properties) {
    await ensure('notifications',{user_id:property.owner_id,property_id:property.id,title:`Listing ${property.moderation_status}`},{category:'listing',body:`${property.title} is ${property.moderation_status}.`,read_at:property.id%2?stamp(-1):null});
    await ensure('activity_logs',{action:'demo.listing.seeded',target_type:'property',target_id:property.id},{actor_id:users.admin[0].id,outcome:property.moderation_status==='rejected'?'warning':'success',description:`Demo listing: ${property.title}`});
  }
  await ensure('platform_settings',{id:1},{platform_name:'RentNest',support_email:'support@rentnest.test',currency:'BDT',timezone:'Asia/Dhaka'});
  await db.commit();
  console.log('Development seed committed. Existing rows and settings were preserved.');
} catch(error) {
  if(db) await db.rollback();
  console.error(`Seed failed: ${error.code ?? error.message}`); process.exitCode=1;
} finally {
  if(locked) await db.execute('SELECT RELEASE_LOCK(?)',[lockName]);
  db?.release(); await pool.end();
}

