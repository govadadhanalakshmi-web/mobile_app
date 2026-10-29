import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export function GoogleTasksHeader({
  user,
  onLogout,
  isDark = true,
  onToggleTheme,
  theme,
}) {
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <View style={[styles.headerContainer, { borderBottomColor: theme.surfaceBorder }]}>
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Tasks</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Google Tasks Style</Text>
      </View>

      {/* Right: Profile Avatar Button (Responsive, no clipping) */}
      <TouchableOpacity
        style={[styles.avatarButton, { backgroundColor: theme.primary }]}
        onPress={() => setProfileModalVisible(true)}
        activeOpacity={0.8}
        accessibilityLabel="User Account Profile"
      >
        <Text style={styles.avatarText}>{userInitial}</Text>
      </TouchableOpacity>

      {/* Profile & Account Modal */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View
            style={[
              styles.profileSheet,
              { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
            ]}
          >
            {/* Header info */}
            <View style={styles.profileInfoRow}>
              <View style={[styles.largeAvatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.largeAvatarText}>{userInitial}</Text>
              </View>
              <View style={styles.nameEmailCol}>
                <Text style={[styles.userName, { color: theme.textPrimary }]}>
                  {user?.name || 'Authorized User'}
                </Text>
                <Text style={[styles.userEmail, { color: theme.textMuted }]}>
                  {user?.email || 'user@todomaster.com'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.surfaceBorder }]} />

            {/* Theme Toggle */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onToggleTheme();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{isDark ? '☀️' : '🌙'}</Text>
              <Text style={[styles.menuText, { color: theme.textPrimary }]}>
                {isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.surfaceBorder }]} />

            {/* Logout */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                setProfileModalVisible(false);
                onLogout();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  titleSection: {
    flex: 1,
    flexShrink: 1,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileSheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 8,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  nameEmailCol: {
    flex: 1,
    flexShrink: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutItem: {
    marginTop: 4,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

