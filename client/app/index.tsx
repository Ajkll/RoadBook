import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // You can add authentication logic here
  const isLoggedIn = true;

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}
