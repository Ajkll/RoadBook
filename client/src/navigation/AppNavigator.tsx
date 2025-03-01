import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase/auth";
import { login, logout } from "../store/slices/authSlice";
import AuthNavigator from "./AuthNavigator";
import RoadbookNavigator from "./RoadbookNavigator";
import { View, Text } from "react-native";

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          login({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
        );
      } else {
        dispatch(logout());
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RoadbookNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
