export const KENYA_COUNTIES = [
  'Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita Taveta','Garissa','Wajir','Mandera',
  'Marsabit','Isiolo','Meru','Tharaka Nithi','Embu','Kitui','Machakos','Makueni','Nyandarua',
  'Nyeri','Kirinyaga',"Murang'a",'Kiambu','Turkana','West Pokot','Samburu','Trans Nzoia',
  'Uasin Gishu','Elgeyo Marakwet','Nandi','Baringo','Laikipia','Nakuru','Narok','Kajiado',
  'Kericho','Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya','Kisumu','Homa Bay',
  'Migori','Kisii','Nyamira','Nairobi'
];

export const USER_ROLES = [
  { value: 'citizen', label: 'Citizen / Tenant — pay & report' },
  { value: 'operator', label: 'Operator — kiosks & meters' },
  { value: 'technician', label: 'Technician — repairs' },
  { value: 'county_admin', label: 'County officer — WASREB & vendors' },
  { value: 'super_admin', label: 'Admin — whole utility' },
];

// WASREB domestic tariff guide (KES/m3) + jerrican equivalent
export const TARIFF_GUIDE = {
  pipedPerM3: 105,
  kioskPer20L: 2.5,
  vendorMaxPer20L: 5,
  ussd: '*384*99#',
};

export function formatKES(n) {
  const v = Number(n || 0);
  return `Ksh ${v.toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
}

export function formatToken(token) {
  const clean = String(token || '').replace(/[^0-9]/g, '');
  return clean.match(/.{1,4}/g)?.join('-') || token;
}
