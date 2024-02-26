import { TabScreenProps } from "app/navigators/TabNavigator";
import React, { FC } from "react";
import { FlatList, View, ViewStyle } from "react-native";
import { Button, Header, ListItem, Screen, Text } from "../../components";
import { colors, spacing, layout } from "../../theme";
import { useStores } from "../../models";
import { observer } from "mobx-react-lite";
import { logout } from "solid-authn-react-native";
import Dialog from "react-native-dialog";

const $flatListContentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};

const $flatListStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  backgroundColor: colors.palette.neutral200,
  flex: 1,
};

const $item: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  marginVertical: spacing.md,
};

const { fill, center } = layout;

export const ThingsScreen: FC<TabScreenProps<"Overview">> = observer(
  function ThingsScreen(props) {
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [id, setId] = React.useState("");
    const { thingsStore } = useStores();
    const things = thingsStore.things;
    const { navigation } = props;
    const ids = thingsStore.thingIds();

    const showDialog = () => {
      setDialogVisible(true);
    };

    const handleCancel = () => {
      setDialogVisible(false);
    };

    const handleDelete = () => {
      thingsStore.removeThing(id);
      setDialogVisible(false);
    };

    return (
      <Screen
        contentContainerStyle={$flatListContentContainer}
        safeAreaEdges={["top"]}
      >
        <Header title="Things" rightTx="common.logOut" onRightPress={logout} />
        <Dialog.Container visible={dialogVisible}>
          <Dialog.Title>Delete Thing</Dialog.Title>
          <Dialog.Description>
            Do you want to delete this Thing? You cannot undo this action.
          </Dialog.Description>
          <Dialog.Button label="Cancel" onPress={handleCancel} />
          <Dialog.Button label="Delete" onPress={handleDelete} />
        </Dialog.Container>
        <Text tx="thingsScreen.tagLine" />
        <View style={[fill, $item]}>
          {things.size > 0 ? (
            <FlatList
              data={ids}
              style={$flatListStyle}
              renderItem={({ item, index }) => (
                <ListItem
                  text={item}
                  onPress={() =>
                    navigation.navigate("ThingsDetail", { name: item })
                  }
                  TextProps={{ numberOfLines: 1 }}
                  topSeparator={index === 0}
                  bottomSeparator
                  rightIcon="caretRight"
                  onLongPress={() => {
                    setId(item);
                    showDialog();
                  }}
                />
              )}
            />
          ) : (
            <Text tx="thingsScreen.noThings" style={center} />
          )}
        </View>
        <Button
          tx="thingsScreen.addThing"
          onPress={() => navigation.navigate("AddThing")}
        />
      </Screen>
    );
  },
);
