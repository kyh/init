import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { skipToken, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";

import { authClient, signInWithGithub } from "@/utils/auth";
import { trpc } from "@/utils/api";

/**
 * Exercises the end-to-end typed tRPC path from React Native: cookie propagation
 * and superjson batching against the Next route, proving the wiring the template
 * ships actually resolves. todo.list is organization-scoped, so this resolves the
 * first membership's slug — mirroring the web dashboard's fallback — and gates the
 * query with skipToken until one exists.
 */
function Todos() {
  const { data: organizations } = authClient.useListOrganizations();
  const slug = organizations?.[0]?.slug;

  const todos = useQuery(trpc.todo.list.queryOptions(slug ? { slug } : skipToken));

  if (!slug || todos.isPending) {
    return <ActivityIndicator className="pt-4" />;
  }

  if (todos.error) {
    return <Text className="text-destructive pt-4 text-center">{todos.error.message}</Text>;
  }

  return (
    <View className="pt-4">
      {todos.data.todos.length === 0 ? (
        <Text className="text-muted-foreground text-center">No todos yet</Text>
      ) : (
        todos.data.todos.map((todo) => (
          <Text key={todo.id} className="text-foreground py-1">
            {todo.completed ? "☑" : "☐"} {todo.title}
          </Text>
        ))
      )}
    </View>
  );
}

function MobileAuth() {
  const { data: session } = authClient.useSession();

  return (
    <>
      <Text className="text-foreground pb-2 text-center text-xl font-semibold">
        {session?.user.name ? `Hello, ${session.user.name}` : "Not logged in"}
      </Text>
      <Pressable
        onPress={() => (session ? authClient.signOut() : signInWithGithub({ callbackURL: "/" }))}
        className="bg-primary flex items-center rounded-sm p-2"
      >
        <Text>{session ? "Sign Out" : "Sign In With Github"}</Text>
      </Pressable>

      {session ? <Todos /> : null}
    </>
  );
}

export default function Index() {
  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="bg-background h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center text-5xl font-bold">
          <Text className="text-primary">Init</Text>
        </Text>
        <MobileAuth />
      </View>
    </SafeAreaView>
  );
}
