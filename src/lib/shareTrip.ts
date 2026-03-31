import { Trip } from '../types';

const formatMoney = (amount: number, currencyCode?: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode || 'USD'} ${amount}`;
  }
};

export const buildTripShareText = (trip: Trip) => {
  const lines: string[] = [];

  lines.push(`${trip.summary.title || trip.destination}`);
  lines.push(`${trip.destination}`);
  lines.push(`${trip.startDate} - ${trip.endDate}`);
  lines.push(`${trip.travelers} traveler${trip.travelers > 1 ? 's' : ''}`);
  lines.push(`Budget style: ${trip.budgetStyle}`);
  lines.push(`Pace: ${trip.pace}`);
  lines.push(`Estimated total: ${formatMoney(trip.summary.totalCostEstimate, trip.summary.currencyCode)}`);
  lines.push('');
  lines.push('Overview');
  lines.push(trip.summary.description);
  lines.push('');

  lines.push('Stay');
  lines.push(`${trip.stay.areaName} - ${trip.stay.areaDescription}`);
  if (trip.stay.hotels?.length) {
    trip.stay.hotels.slice(0, 3).forEach((hotel) => {
      lines.push(`- ${hotel.name} (${formatMoney(hotel.pricePerNight, trip.summary.currencyCode)}/night)`);
    });
  }
  lines.push('');

  lines.push('Itinerary');
  trip.itinerary.forEach((day) => {
    lines.push('');
    lines.push(`Day ${day.dayNumber} - ${day.date}`);
    lines.push(day.theme);

    day.modules.forEach((item) => {
      const location = item.location ? ` @ ${item.location}` : '';
      lines.push(`- ${item.time} | ${item.title}${location}`);
      lines.push(`  ${item.description}`);
    });
  });

  lines.push('');
  lines.push('Planned with TripLess');

  return lines.join('\n');
};

export const shareTrip = async (trip: Trip) => {
  const text = buildTripShareText(trip);
  const title = `${trip.destination} itinerary`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({
      title,
      text,
    });
    return 'shared';
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }

  return 'unsupported';
};

export const downloadTripAsText = (trip: Trip) => {
  const text = buildTripShareText(trip);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${trip.destination.toLowerCase().replace(/\s+/g, '-')}-itinerary.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};
