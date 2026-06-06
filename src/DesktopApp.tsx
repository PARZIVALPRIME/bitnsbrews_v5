import { AppUI } from "./AppUI";
import { Scene } from "./soc/Scene";

export default function DesktopApp() {
  return <AppUI sceneComponent={Scene} />;
}
