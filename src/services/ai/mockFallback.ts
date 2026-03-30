import { Trip, ChangeSummary } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const mockTrip: Trip = {
  id: uuidv4(),
  destination: "Tokyo, Japan",
  startDate: "2026-04-10",
  endDate: "2026-04-15",
  travelers: 2,
  budgetStyle: "balanced",
  pace: "medium",
  summary: {
    title: "The Ultimate Tokyo Experience",
    description: "A perfect blend of tradition and futurism in the heart of Japan.",
    totalCostEstimate: 250000,
    currencyCode: "JPY"
  },
  stay: {
    areaName: "Shinjuku",
    areaDescription: "The bustling heart of Tokyo with endless dining, shopping, and neon lights.",
    hotels: [
      {
        id: "h1",
        name: "Park Hyatt Tokyo",
        pricePerNight: 50000,
        tags: ["Luxury", "Iconic View", "Spa"],
        description: "Sophisticated luxury with breathtaking views of the city and Mount Fuji."
      },
      {
        id: "h2",
        name: "Hotel Gracery Shinjuku",
        pricePerNight: 18000,
        tags: ["Modern", "Great Location", "Godzilla"],
        description: "A modern hotel famous for its life-size Godzilla head and central location."
      },
      {
        id: "h3",
        name: "Keio Plaza Hotel",
        pricePerNight: 22000,
        tags: ["Classic", "Family Friendly", "Large"],
        description: "A well-established hotel offering a wide range of amenities and rooms."
      }
    ]
  },
  itinerary: [
    {
      dayNumber: 1,
      date: "2026-04-10",
      theme: "Neon & Nightlife",
      modules: [
        {
          id: "m1",
          type: "transit",
          time: "02:00 PM",
          duration: "1 hour",
          title: "Arrival at Narita Airport",
          description: "Pick up your JR Pass and take the Narita Express to Shinjuku Station.",
          costEstimate: 3000,
          tags: ["Transport", "N'EX"]
        },
        {
          id: "m2",
          type: "activity",
          time: "04:00 PM",
          duration: "2 hours",
          title: "Shinjuku Gyoen National Garden",
          description: "A large park and garden in Shinjuku and Shibuya. It was originally a residence of the Naitō family in the Edo period.",
          costEstimate: 500,
          tags: ["Nature", "Garden", "Chill"]
        },
        {
          id: "m3",
          type: "meal",
          time: "07:00 PM",
          duration: "1.5 hours",
          title: "Dinner at Omoide Yokocho",
          description: "Also known as 'Piss Alley', this narrow street is packed with tiny yakitori stalls.",
          costEstimate: 4000,
          tags: ["Local", "Street Food", "Atmospheric"]
        }
      ]
    }
  ]
};

export const mockChangeSummary: ChangeSummary = {
  message: "Updated your hotel suggestions to be more budget-friendly as requested.",
  affectedDays: [],
  changedModules: ["Stay"],
  unchangedModules: ["Day 1", "Day 2", "Day 3"],
  timingAdjusted: false,
  explanation: "I found three highly-rated hotels in the same area that offer better value while maintaining great access to the city."
};
