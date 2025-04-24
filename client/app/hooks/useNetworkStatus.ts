import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setNetworkStatus } from '../store/slices/networkSlice';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [details, setDetails] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected || false);
      setIsInternetReachable(state.isInternetReachable || false);
      setConnectionType(state.type);
      setDetails(state);

      dispatch(
        setNetworkStatus({
          isConnected: state.isConnected || false,
          isInternetReachable: state.isInternetReachable || false,
          connectionType: state.type || null,
          details: state || null,
        })
      );

      console.log(
        'Etat de connexion mis à jour dans le store:',
        state.isInternetReachable ? 'En ligne' : 'Hors ligne'
      );
    });

    return () => unsubscribe();
  }, [dispatch]);

  return { isConnected, isInternetReachable, connectionType, details };
};
