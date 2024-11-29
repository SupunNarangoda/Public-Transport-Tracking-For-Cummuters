import React from "react";
import { Link, router } from "expo-router";
import { SafeAreaView, View, Image, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons } from "../../constants";

const Profile = () => {
  const { user, userId, setUser, setIsLogged, loading } = useGlobalContext();
  const auth = getAuth();

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsLogged(false);
      router.replace("/sign-in")
     
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading) {     // Display loading spinner while user data is being fetched
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a1a1a]">
      <View className="w-full justify-center items-center px-4 pt-10 pb-6">
        {/* Logout Button */}
        <TouchableOpacity onPress={logout} className="self-end mt-6 mb-4">
          <Image
            source={icons.logout}
            className="w-6 h-6"
            resizeMode="contain"
          />
        </TouchableOpacity>
  
        {/* Profile Avatar */}
        <View className="w-24 h-24 border-2 border-white rounded-full justify-center items-center mt-4">
          <Image
            source={{ uri: user.photoURL }}
            className="w-[90%] h-[90%] rounded-full"
            resizeMode="cover"
          />
        </View>
  
        {/* User Information */}
        <View className="mt-4 items-center">
          <Text className="text-xl text-white font-bold">
            {user.name || "No Name Available"}
          </Text>
          <Text className="text-lg text-gray-400 mt-2">
            {user.email || "No Email Available"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};  
export default Profile;

