import { ref } from 'vue';
import {
  getCurrentLocation as getLocationInfo,
  isLocationSupported,
  isSecureContext,
  formatCoordinates,
  formatAddress
} from '../utils/locationUtils';

export { isLocationSupported, isSecureContext, formatCoordinates, formatAddress };

export function useGeolocation() {
  const locationLoading = ref(false);
  const locationInfo = ref({
    success: false,
    longitude: null,
    latitude: null,
    address: '',
    district: '',
    city: '',
    province: ''
  });
  const locationError = ref('');

  const getCurrentLocation = async () => {
    if (locationLoading.value) return;

    locationLoading.value = true;
    locationError.value = '';

    try {
      const location = await getLocationInfo();
      locationInfo.value = location;
      console.log('位置获取成功:', location);
    } catch (error) {
      locationError.value = error.message;
      console.error('位置获取失败:', error);
    } finally {
      locationLoading.value = false;
    }
  };

  return {
    locationLoading,
    locationInfo,
    locationError,
    getCurrentLocation
  };
}
