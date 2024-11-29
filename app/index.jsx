import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {LogBox} from "react-native";

import firebase from 'firebase/compat/app';
import 'firebase/auth';
import { images } from "../constants";
import { CustomButton, Loader } from "../components";
import { useGlobalContext } from "../context/GlobalProvider";
import { FIREBASE_CONFIG } from "../core/config"; // Make sure to set up and export your Firebase config

// Initialize Firebase if not already initialized


const app = firebase.initializeApp(FIREBASE_CONFIG);



const Welcome = () => {
  const { loading, isLogged } = useGlobalContext();
    LogBox.ignoreAllLogs();

  if (!loading && isLogged) return <Redirect href="/home" />;

  return (
    <SafeAreaView className="bg-primary h-full">
      <Loader isLoading={loading} />

      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
      >
        <View className="w-full flex justify-center items-center h-full px-4">
          <View className="relative mt-5">
            <Image
              source={images.logo}
              className="w-[200px] h-[200px]"
              resizeMode="contain"
            />
            <Text className="text-3xl text-white font-bold text-center mt-4">
              Get Started
            </Text>
          </View>

          <CustomButton
            title="Sign In"
            handlePress={() => router.push("/sign-in")}
            containerStyles="w-full mt-7 bg-blue-600"
          />
          <CustomButton
            title="Sign Up"
            handlePress={() => router.push("/sign-up")}
            containerStyles="w-full mt-4 bg-blue-600"
          />
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
};

export default Welcome;
