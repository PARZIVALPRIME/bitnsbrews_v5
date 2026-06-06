import { AppUI } from "./AppUI";
import { Scene } from "./soc/Scene";

export default function MobileApp() {
  return <AppUI sceneComponent={Scene} quality="mobile" />;
}
