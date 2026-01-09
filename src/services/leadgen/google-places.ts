import axios from 'axios';

export interface PlaceResult {
  placeId: string;
  businessName: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUrl?: string;
  businessType?: string;
}

export interface ScraperOptions {
  businessType: string;
  location: string;
  radius?: number;
  maxResults?: number;
}

/**
 * Google Places API Service
 * Requires GOOGLE_PLACES_API_KEY in environment variables
 */
class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not found in environment variables');
    }
  }

  /**
   * Search for businesses using Google Places Text Search
   */
  async searchPlaces(options: ScraperOptions): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key is not configured');
    }

    const { businessType, location, radius = 5000, maxResults = 50 } = options;
    const query = `${businessType} in ${location}`;

    try {
      // Text Search API
      const searchResponse = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query,
          key: this.apiKey,
          radius,
        },
      });

      if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${searchResponse.data.status}`);
      }

      const places = searchResponse.data.results || [];
      const limitedPlaces = places.slice(0, maxResults);

      // Get detailed information for each place
      const detailedPlaces = await Promise.all(
        limitedPlaces.map((place: any) => this.getPlaceDetails(place.place_id))
      );

      return detailedPlaces.filter((place): place is PlaceResult => place !== null);
    } catch (error: any) {
      console.error('Error searching places:', error);
      throw new Error(error.response?.data?.error_message || error.message);
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_phone_number,formatted_address,website,rating,user_ratings_total,url,types',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        console.warn(`Failed to get details for place ${placeId}: ${response.data.status}`);
        return null;
      }

      const place = response.data.result;

      return {
        placeId,
        businessName: place.name || 'Unknown',
        phoneNumber: place.formatted_phone_number || undefined,
        address: place.formatted_address || undefined,
        website: place.website || undefined,
        rating: place.rating || undefined,
        reviewCount: place.user_ratings_total || undefined,
        googleMapsUrl: place.url || undefined,
        businessType: place.types?.[0] || undefined,
      };
    } catch (error) {
      console.error(`Error getting place details for ${placeId}:`, error);
      return null;
    }
  }

  /**
   * Search nearby places using coordinates
   */
  async searchNearby(lat: number, lng: number, type: string, radius: number = 5000): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key is not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params: {
          location: `${lat},${lng}`,
          radius,
          type,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      const places = response.data.results || [];

      const detailedPlaces = await Promise.all(
        places.map((place: any) => this.getPlaceDetails(place.place_id))
      );

      return detailedPlaces.filter((place): place is PlaceResult => place !== null);
    } catch (error: any) {
      console.error('Error searching nearby places:', error);
      throw new Error(error.response?.data?.error_message || error.message);
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key is not configured');
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }
}

export default new GooglePlacesService();
