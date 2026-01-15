import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    title: "Bringing Freshness\nHome with Naimo",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
    title: "Fast & Reliable\nDelivery Service",
    description:
      "Get your groceries delivered to your doorstep within minutes. Fresh products guaranteed every time.",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=800",
    title: "Best Deals &\nOffers For You",
    description:
      "Enjoy exclusive discounts and offers on your favorite products. Save more with every order.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentData = onboardingData[currentIndex];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to login
      router.replace("/(auth)/login");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/login");
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: currentData.image }} style={styles.image} />
        
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
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
                : "Get started"}
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
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    position: "absolute",
    bottom: 20,
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
    backgroundColor: "#22C55E",
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
    color: "#1E293B",
    lineHeight: 42,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#1E293B",
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
    backgroundColor: "#22C55E",
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
    color: "#64748B",
  },
  loginLink: {
    color: "#22C55E",
    fontWeight: "600",
  },
});