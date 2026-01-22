import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTeamInfo } from '../hooks/useApi';
import { Card, Badge, Button } from '../components/ui';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../theme';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { data: team } = useTeamInfo();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Badge 
                variant={user?.role === 'admin' ? 'success' : 'info'}
                style={styles.roleBadge}
              >
                {user?.role === 'admin' ? 'Admin' : 'Player'}
              </Badge>
            </View>
          </View>
        </Card>
      </View>

      {team && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team</Text>
          
          <Card style={styles.menuItem}>
            <Text style={styles.menuLabel}>Team Name</Text>
            <Text style={styles.menuValue}>{team.name}</Text>
          </Card>
          
          <Card style={styles.menuItem}>
            <Text style={styles.menuLabel}>Invite Code</Text>
            <Text style={styles.menuValueCode}>{team.inviteCode}</Text>
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        
        <TouchableOpacity>
          <Card style={styles.menuItem}>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Card style={styles.menuItem}>
            <Text style={styles.menuLabel}>About FoulPay</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Card>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Card style={styles.menuItem}>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Card>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Button 
          variant="danger" 
          onPress={handleLogout}
          fullWidth
        >
          Sign Out
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FoulPay Mobile v1.0.0</Text>
        <Text style={styles.footerSubtext}>Made for UK Sports Teams</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate[900],
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing['2xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.slate[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  profileCard: {
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
    marginTop: 2,
  },
  roleBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  menuItem: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  menuLabel: {
    fontSize: fontSize.base,
    color: colors.white,
  },
  menuValue: {
    fontSize: fontSize.sm,
    color: colors.slate[400],
  },
  menuValueCode: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontFamily: 'monospace',
  },
  menuArrow: {
    fontSize: fontSize.xl,
    color: colors.slate[500],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingBottom: spacing['5xl'],
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.slate[500],
  },
  footerSubtext: {
    fontSize: fontSize.xs,
    color: colors.slate[600],
    marginTop: spacing.xs,
  },
});
