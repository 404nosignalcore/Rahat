import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';
import { AppIcon } from '../ui/AppIcon';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onSubmitEditing,
  onFocus,
  onBlur,
  returnKeyType = 'search',
  autoCapitalize = 'none',
  autoCorrect = false,
  style,
  inputStyle,
  accessibilityLabel = 'Search',
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <AppIcon name="search" size={16} color={Colors.inkMuted48} />
      </View>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.inkMuted48}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[styles.input, inputStyle]}
      />
      {value.length > 0 && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          onPress={onClear}
          style={styles.clearBtn}
        >
          <AppIcon name="close" size={14} color={Colors.inkMuted48} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44, // Exact DESIGN.md spec: 44px
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.pill, // Exact DESIGN.md spec: rounded.pill
    borderWidth: 1,
    borderColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.374,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    borderRadius: BorderRadius.full,
  },
});
