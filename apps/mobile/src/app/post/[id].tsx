import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useGlobalSearchParams } from "expo-router";

export default function Post() {
  const { id } = useGlobalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: `Post ${id}` }} />
      <View className="h-full w-full p-4">
        <Text className="text-primary py-2 text-3xl font-bold">Post {id}</Text>
      </View>
    </SafeAreaView>
  );
}
