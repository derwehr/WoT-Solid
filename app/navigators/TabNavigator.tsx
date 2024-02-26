import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../components";
import { translate } from "../i18n";
import { DataScreen, LogScreen, ThingsScreen } from "../screens";
import { colors, spacing, typography } from "../theme";
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator";

export type TabParamList = {
  Log: undefined;
  Data: undefined;
  Overview: undefined;
};

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>;

const Tab = createBottomTabNavigator<TabParamList>();

export function Navigator() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [$tabBar, { height: bottom + 70 }],
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: $tabBarLabel,
        tabBarItemStyle: $tabBarItem,
      }}
    >
      <Tab.Screen
        name="Overview"
        component={ThingsScreen}
        options={{
          tabBarLabel: translate("thingsScreen.thingsTitle"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="robot" color={focused && colors.tint} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{
          tabBarLabel: translate("log.logTab"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="log" color={focused && colors.tint} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Data"
        component={DataScreen}
        options={{
          tabBarLabel: translate("dataScreen.title"),
          tabBarIcon: ({ focused }) => (
            <Icon icon="rdf" color={focused && colors.tint} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const $tabBar: ViewStyle = {
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
};

const $tabBarItem: ViewStyle = {
  paddingTop: spacing.md,
};

const $tabBarLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  flex: 1,
};

// @demo remove-file
