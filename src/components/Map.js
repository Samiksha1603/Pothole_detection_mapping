import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from "@react-google-maps/api";
// import { collection, getDocs, query } from "firebase/firestore";
import { getDatabase, ref, get } from "firebase/database";
import { db } from "../firebase.config";
import pothole from "../assets/img/pothole.jpg";
const center = { lat: 19.0522, lng: 72.9005 };

function Map() {
  const navigate = useNavigate();
  const [potholes, setPotholes] = useState(null);
  const [newpothole, setNewPothole] = useState(null);
  const [storePothole,setStorePothole] = useState(null);
  

  useEffect(() => {
    const fetchPotholes = async () => {
      try {
        const database = getDatabase();
        const potholeRef = ref(database, "readings");
        const snapshot = await get(potholeRef);
        const potholeData = [];

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            potholeData.push({
              id: childSnapshot.key,
              data: childSnapshot.val(),
            });
          });
          setPotholes(potholeData);
        } else {
          console.log("No data available");
        }
      } catch (error) {
        console.error("Error fetching potholes: ", error);
      }
    };

    fetchPotholes();
  }, []);

  





  function convertNMEAtoDecimalCoordinates(nmeaSentence) {
    // Split the NMEA sentence by commas
    const parts = nmeaSentence.split(',');
  
    // Check if the NMEA sentence has a recognized format
    const supportedFormats = ["$GPGGA", "$GPGLL", "$GPRMC", "$GPVTG", "$GPGSA", "$GPGSV"];
    if (!supportedFormats.includes(parts[0]) || parts.length < 10) {
      return null; // Invalid or unsupported NMEA sentence
    }
  
    let latitude, longitude;
    let latitudeDirection, longitudeDirection; // Declare the variables here
  
    if (parts[0] === "$GPGGA" || parts[0] === "$GPGLL") {
      // Extract latitude and longitude components for "$GPGGA" and "$GPGLL" formats
      latitude = parseFloat(parts[2]);
      latitudeDirection = parts[3] === 'N' ? 1 : -1;
      longitude = parseFloat(parts[4]);
      longitudeDirection = parts[5] === 'E' ? 1 : -1;
    } else if (parts[0] === "$GPRMC") {
      // Extract latitude and longitude components for "$GPRMC" format
      latitude = parseFloat(parts[3]);
      latitudeDirection = parts[4] === 'N' ? 1 : -1;
      longitude = parseFloat(parts[5]);
      longitudeDirection = parts[6] === 'E' ? 1 : -1;
    } // Add more conditions for other supported formats here
  
    // Convert latitude and longitude to decimal degrees
    const decimalLatitude = latitudeDirection * (Math.floor(latitude / 100) + (latitude % 100) / 60);
    const decimalLongitude = longitudeDirection * (Math.floor(longitude / 100) + (longitude % 100) / 60);
  
    return { latitude: decimalLatitude, longitude: decimalLongitude };
  }
  
  

  // Example usage
  let store = [];
  useEffect(() => {
    if (potholes) {
      const coordinatesArray = potholes.map((data) => {
        if (data.data.loc) {
          const coordinates = convertNMEAtoDecimalCoordinates(data.data.loc);
          if (coordinates) {
            const { latitude, longitude } = coordinates;
            return { latitude, longitude };
          }
        } else {
          return { latitude: data.data.lat, longitude: data.data.lng };
        }
      }).filter((coordinates) => coordinates); // Remove null values
  
      setStorePothole(coordinatesArray);
    }
  }, [potholes]);
  
  

  
  if (potholes) {
    const coordinates = convertNMEAtoDecimalCoordinates(potholes[4].data.loc);

    if (coordinates) {
      // console.log("Latitude: " + coordinates.latitude);
      // console.log("Longitude: " + coordinates.longitude);
    } else {
      console.log("Invalid NMEA sentence.");
    }
  }




  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDnyb11tWZluAFYBaG8sEVYpu2L6nwIWPE",
    libraries: ["places"],
  });

  const handleGoBack = () => {
    navigate("/");
  };

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);

  const originRef = useRef();
  const destinationRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  console.log(storePothole);

  const renderPotholeMarkers = () => {
    if (!storePothole) return null;

    return storePothole.map((pothole, index) => {
      const { latitude, longitude } = pothole;
      console.log(latitude,longitude)
      return (
        <Marker
          key={index}
          position={{ lat: latitude, lng: longitude }}
        // icon={{
        //   url: 'https://media.istockphoto.com/id/469568948/photo/a-large-red-map-pointer-isolated-on-a-white-background.webp?b=1&s=170667a&w=0&k=20&c=dHWkzrBQyMSG5soZ51-6BrfSVs_6YpBv2GqkBIhZmnE=',
        //   scaledSize: new window.google.maps.Size(30, 30),
        // }}
        />
      );
    });
  };

  async function calculateRoute() {
    if (originRef.current.value === "" || destinationRef.current.value === "") {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });



    setDirectionsResponse(results);
    setButtonClicked(true);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destinationRef.current.value = "";
    setButtonClicked(false);
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
          {buttonClicked && renderPotholeMarkers()}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius="lg"
        m={4}
        bgColor="white"
        shadow="base"
        minW="container.md"
        zIndex="1"
      >
        <HStack spacing={2} justifyContent="space-between">
          <Box flexGrow={1}>
            <Autocomplete>
              <Input type="text" placeholder="Origin" ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type="text"
                placeholder="Destination"
                ref={destinationRef}
              />
            </Autocomplete>
          </Box>
          <ButtonGroup>
            <Button colorScheme="pink" type="submit" onClick={calculateRoute}>
              Calculate Route
            </Button>
            <ButtonGroup>
              <Button colorScheme="pink" type="submit" onClick={handleGoBack}>
                Go Back
              </Button>
            </ButtonGroup>
            <IconButton
              aria-label="center back"
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent="space-between">
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label="center back"
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default Map;