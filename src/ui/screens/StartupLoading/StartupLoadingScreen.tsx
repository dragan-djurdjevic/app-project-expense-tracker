// Spec: AR-010
import { Center, Loader } from "@mantine/core";

/** AR-010 step 3a: shown while the demo seed runs. */
export default function StartupLoadingScreen() {
  return (
    <Center h="100vh">
      <Loader />
    </Center>
  );
}
