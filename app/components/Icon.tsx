import * as React from "react";
import { ComponentType } from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native";

export type IconTypes = keyof typeof iconRegistry;

interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  icon: IconTypes;

  /**
   * An optional tint color for the icon
   */
  color?: string;

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number;

  /**
   * Style overrides for the icon image
   */
  style?: StyleProp<ImageStyle>;

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * An optional function to be called when the icon is pressed
   */
  onPress?: TouchableOpacityProps["onPress"];
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity /> if `onPress` is provided, otherwise a <View />.
 *
 * - [Documentation and Examples](https://github.com/infinitered/ignite/blob/master/docs/Components-Icon.md)
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...WrapperProps
  } = props;

  const isPressable = !!WrapperProps.onPress;
  const Wrapper: ComponentType<TouchableOpacityProps> = WrapperProps?.onPress
    ? TouchableOpacity
    : View;

  return (
    <Wrapper
      accessibilityRole={isPressable ? "imagebutton" : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <Image
        style={[
          $imageStyle,
          color && { tintColor: color },
          size && { width: size, height: size },
          $imageStyleOverride,
        ]}
        source={iconRegistry[icon]}
      />
    </Wrapper>
  );
}

export const iconRegistry = {
  back: require("../../icons/back.png"),
  bell: require("../../icons/bell.png"),
  bell_slash: require("../../icons/bell-slash.png"),
  caretLeft: require("../../icons/caretLeft.png"),
  caretRight: require("../../icons/caretRight.png"),
  check: require("../../icons/check.png"),
  clap: require("../../icons/clap.png"),
  community: require("../../icons/community.png"),
  components: require("../../icons/components.png"),
  debug: require("../../icons/debug.png"),
  github: require("../../icons/github.png"),
  heart: require("../../icons/heart.png"),
  hidden: require("../../icons/hidden.png"),
  ladybug: require("../../icons/ladybug.png"),
  log: require("../../icons/log.png"),
  lock: require("../../icons/lock.png"),
  menu: require("../../icons/menu.png"),
  more: require("../../icons/more.png"),
  pin: require("../../icons/pin.png"),
  podcast: require("../../icons/podcast.png"),
  rdf: require("../../icons/rdf.png"),
  robot: require("../../icons/robot.png"),
  settings: require("../../icons/settings.png"),
  slack: require("../../icons/slack.png"),
  view: require("../../icons/view.png"),
  x: require("../../icons/x.png"),
};

const $imageStyle: ImageStyle = {
  resizeMode: "contain",
};
