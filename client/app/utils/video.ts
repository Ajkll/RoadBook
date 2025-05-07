import { Camera } from 'expo-camera';

export const requestCameraPermission = async () => {
  const cameraPermission = await Camera.requestCameraPermissionsAsync();
  const microphonePermission = await Camera.requestMicrophonePermissionsAsync();

  return cameraPermission.status === 'granted' && microphonePermission.status === 'granted';
};
