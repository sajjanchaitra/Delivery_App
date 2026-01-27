// app/onboarding.tsx
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
} from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    title: "Bringing Freshness\nHome with Naimo",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
    title: "Fast & Reliable\nDelivery Service",
    description:
      "Get your groceries delivered to your doorstep within minutes. Fresh products guaranteed every time.",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=800",
    title: "Best Deals &\nOffers For You",
    description:
      "Enjoy exclusive discounts and offers on your favorite products. Save more with every order.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const completeOnboarding = async () => {
    // Save that user has seen onboarding
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleLogin = () => {
    completeOnboarding();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={{ uri: item.image }} style={styles.image} />
    </View>
  );

  const currentData = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
        />

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{currentData.title}</Text>
        <Text style={styles.description}>{currentData.description}</Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip tour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedButtonText}>
              {currentIndex === onboardingData.length - 1
                ? "Get started"
                : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginContainer}
          onPress={handleLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            Already have account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    height: height * 0.55,
    width: "100%",
    position: "relative",
  },
  slide: {
    width: width,
    height: height * 0.55,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#E63946",
    width: 28,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E3A8A",
    lineHeight: 42,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  getStartedButton: {
    flex: 1,
    backgroundColor: "#E63946",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loginContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    color: "#E63946",
    fontWeight: "600",
  },
});