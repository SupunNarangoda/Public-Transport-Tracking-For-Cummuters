import React, { useState, useEffect, useRef, useCallback } from "react";
import {SafeAreaView,StyleSheet,Text,ScrollView,TextInput,Button,Alert,View,Modal,TouchableOpacity,} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { ref, onValue } from "firebase/database";
import { database } from "../../core/config.js";
import { getFirestore, doc, setDoc } from "firebase/firestore"; 

const db = getFirestore(); 

const AVERAGE_SPEED_KMH = 30; // Set an assumed average speed in km/h for ETA calculation

const Bus = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationCount, setLocationCount] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  const [locations, setLocations] = useState([]);
  const [routeNumber, setRouteNumber] = useState("");
  const [predictedCrowdLevel, setPredictedCrowdLevel] = useState(null);
  const [etaData, setEtaData] = useState({});
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState("");
  const mapRef = useRef(null);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  const calculateETA = useCallback((distance) => {
    return distance / AVERAGE_SPEED_KMH; // Returns ETA in hours
  }, []);

  const updateETAData = useCallback(() => {
    if (!currentLocation || locations.length === 0 || !routeNumber) return;
  
    const newEtaData = {};
    
    
    const filteredLocations = locations.filter( // Filter locations based on the entered route number
      (location) => location.routeNumber === routeNumber
    );
  
    filteredLocations.forEach((location) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        location.latitude,
        location.longitude
      );
      const etaHours = calculateETA(distance);
      const etaMinutes = Math.round(etaHours * 60); 
  
      newEtaData[location.id] = etaMinutes;
      console.log(
        `Location ${location.id}: Distance = ${distance} km, ETA = ${etaMinutes} minutes`
      );
    });
  
    setEtaData(newEtaData);
  }, [currentLocation, locations, routeNumber, calculateDistance, calculateETA]);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setCurrentLocation(location.coords);

    if (mapRef.current && initialLoad) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          zoom: 15,
        },
        500
      );
      setInitialLoad(false);
    }

    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        setCurrentLocation(newLocation.coords);
      }
    );

    return () => locationSubscription.remove();
  };

  const fetchLocationCount = () => { // Filter locations to count only those matching the entered route number
    if (routeNumber) {
      const filteredCount = locations.filter(
        (location) => location.routeNumber === routeNumber
      ).length;
      setLocationCount(filteredCount);
    } else {
      setLocationCount(0);
    }
  };

  const fetchAndUpdateLocation = () => {
    const locationRef = ref(database, "location");
    onValue(locationRef, (snapshot) => {
      const locationData = snapshot.val();
      const newLocations = [];
      if (locationData) {
        for (const userId in locationData) {
          const userLocationData = locationData[userId];
          newLocations.push({
            id: userId,
            latitude: userLocationData.latitude,
            longitude: userLocationData.longitude,
            routeNumber: userLocationData.routeNumber, 
          });
        }
        setLocations(newLocations);
      } else {
        console.warn("No location data available.");
      }
    });
  };

  const getDayType = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 0 : 1; //selects 0 for weekend, 1 for weekday
  };

  const getCurrentTime = () => {
    return new Date().getHours();
  };

  const fetchPrediction = async () => {
    if (!routeNumber) {
      Alert.alert("Error", "Please enter a route number.");
      return;
    }

    const inputData = {
      Time: getCurrentTime(),
      Day: getDayType(),
      Route_100: routeNumber === "100" ? 1 : 0,
      Route_101: routeNumber === "101" ? 1 : 0,
      Route_154: routeNumber === "154" ? 1 : 0,
      Route_163: routeNumber === "163" ? 1 : 0,
      Route_176: routeNumber === "176" ? 1 : 0,
    };

    try {
      // const response = await fetch("http://192.168.1.2:5000/predict", {
        const response = await fetch("http://192.168.0.6:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();
      setPredictedCrowdLevel(data.crowd_level);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackValue || !routeNumber) {
      Alert.alert("Error", "Please enter a route number and feedback.");
      return;
    }

    const feedbackData = {
      routeNumber,
      feedback: parseInt(feedbackValue, 10),
      dayType: getDayType(),
      time: getCurrentTime(),
    };

    try {
      await setDoc(doc(db, "bus_feedback", `route_${routeNumber}_${Date.now()}`), feedbackData);
      Alert.alert("Success", "Thank you for your feedback!");
      setFeedbackValue("");
      setFeedbackVisible(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback.");
    }
  };

  useEffect(() => {
    getLocation();
    fetchAndUpdateLocation();

    const intervalId = setInterval(() => {
      fetchLocationCount();
      fetchAndUpdateLocation();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const etaIntervalId = setInterval(updateETAData, 1000);
    return () => clearInterval(etaIntervalId);
  }, [updateETAData]);
  useEffect(() => {
    fetchLocationCount();
  }, [routeNumber, locations]);

return (
  <SafeAreaView className="flex-1 bg-gray-100">
    {/* Top container for input and button */}
    <View className="absolute top-9 left-2 right-2 p-3 bg-white rounded-lg shadow-md z-20 w-[95%] items-center">
      <TextInput
        className="w-full h-10 border border-gray-300 rounded-md px-3 mb-2 bg-white"
        placeholder="Enter Route Number (100/101/176/163/154)"
        keyboardType="numeric"
        value={routeNumber}
        onChangeText={(text) => setRouteNumber(text)}
      />
      <TouchableOpacity
        className="w-full bg-blue-600 p-3 rounded-md items-center"
        onPress={fetchPrediction}
      >
        <Text className="text-white text-lg">Get Crowd Level Prediction</Text>
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <MapView
        className="flex-1 h-[300px]"
        ref={mapRef}
        provider={MapView.PROVIDER_GOOGLE}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description="This is your current location"
          />
        )}
        {locations
          .filter((location) => location.routeNumber === routeNumber)
          .map((location) => (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={`Location ${location.id}`}
              description={`ETA: ${
                etaData[location.id] !== undefined
                  ? `${etaData[location.id]} min`
                  : "Calculating..."
              }`}
            />
          ))}
      </MapView>

      <View className="absolute bottom-3 left-2 right-2 p-3 bg-white rounded-lg shadow-md items-center w-[95%]">
        {predictedCrowdLevel !== null && (
          <Text className="text-lg bg-blue-100 p-3 text-center rounded-md mb-3 w-full">
            Predicted Crowd Level: {predictedCrowdLevel}
          </Text>
        )}
        <TouchableOpacity
          className="w-full bg-blue-600 p-3 rounded-md items-center"
          onPress={() => setFeedbackVisible(true)}
        >
          <Text className="text-white text-lg">Submit Feedback</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={feedbackVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-center bg-grey bg-opacity-10">
          <View className="bg-white p-5 m-5 rounded-lg items-center">
            <Text className="text-xl mb-2">Enter Feedback (1-10)</Text>
            <TextInput
              className="w-full h-10 border border-gray-300 rounded-md px-3 mb-3"
              placeholder="Feedback"
              keyboardType="numeric"
              value={feedbackValue}
              onChangeText={(text) => setFeedbackValue(text)}
            />
            <View className="flex-row justify-between w-full px-5">
              <Button title="Submit" onPress={handleFeedbackSubmit} />
              <Button title="Cancel" onPress={() => setFeedbackVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-36 right-3 w-12 h-12 bg-white rounded-full justify-center items-center border border-gray-300 shadow-md">
        <Text className="text-lg font-bold">{locationCount}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);
};  
export default Bus;



