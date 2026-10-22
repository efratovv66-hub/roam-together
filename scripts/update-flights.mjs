import {mkdir, writeFile} from 'node:fs/promises';

export function normalize(body) {
  if (!Array.isArray(body.departures) || !Array.isArray(body.arrivals)) throw Error('Invalid flight response');
  return ['departures','arrivals'].flatMap(key => body[key].map(f => {
    const movement = key === 'departures' ? f.departure : f.arrival;
    const opposite = key === 'departures' ? f.arrival : f.departure;
    return {
      direction:key === 'departures' ? 'Departure' : 'Arrival',
      number:String(f.number || ''),
      airline:String(f.airline?.name || ''),
      airport:String(opposite?.airport?.name || opposite?.airport?.iata || ''),
      time:String(movement?.revisedTime?.local || movement?.scheduledTime?.local || ''),
      terminal:String(movement?.terminal || ''),
      status:String(f.status || 'Unknown')
    };
  })).filter(f => f.number && Number.isFinite(Date.parse(f.time))).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
}

async function main() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw Error('Set the RAPIDAPI_KEY repository Actions secret first');
  const url = new URL('https://aerodatabox.p.rapidapi.com/flights/airports/iata/TLV');
  url.search = new URLSearchParams({offsetMinutes:'-120',durationMinutes:'720',withLeg:'true',direction:'Both',withCancelled:'true',withCodeshared:'false',withCargo:'false',withPrivate:'false',withLocation:'false'});
  const response = await fetch(url, {headers:{'x-rapidapi-key':key,'x-rapidapi-host':'aerodatabox.p.rapidapi.com'}, signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw Error('Flight provider returned HTTP ' + response.status);
  const flights = normalize(await response.json());
  await mkdir('data', {recursive:true});
  await writeFile('data/tlv-flights.json', JSON.stringify({airport:'TLV',updatedAt:new Date().toISOString(),flights}) + '\n');
  console.log('Updated TLV board: ' + flights.length + ' flights');
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
