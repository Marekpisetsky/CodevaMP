import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { MlbbDraftAgentPick } from "@shared/mobile-legends/types";
import { useAsyncData } from "../hooks/useAsyncData";
import { loadMlbbDraftAgent } from "../services/mlbbDraftAgent";
import { colors } from "../theme/colors";
import { Pill } from "../components/Pill";
import { Section } from "../components/Section";

function formatPickHeadline(pick: MlbbDraftAgentPick) {
  return `${pick.role}: ${pick.headline}`;
}

export function MlbbDraftScreen() {
  const { data, loading, error } = useAsyncData(loadMlbbDraftAgent);

  const heroTagGroups = useMemo(() => {
    if (!data) return [] as string[][];
    return data.priorityPicks.map((pick) => pick.heroes);
  }, [data]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Sincronizando con CodevaMP...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>No se pudo cargar el asistente</Text>
        <Text style={styles.errorSubtitle}>{error.message}</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.version}>Versión {data.version}</Text>
        <Text style={styles.title}>Asistente de Draft MLBB</Text>
        <Text style={styles.subtitle}>
          Actualizado {data.updatedAt}. Mantente alineado con el plan estratégico del club y comparte builds consistentes con la web.
        </Text>
      </View>

      <Section
        title="Item clave"
        subtitle={`Recomendado para ${data.latestItem.recommendedFor.join(", ")}`}
      >
        <Text style={styles.sectionHighlight}>{data.latestItem.name}</Text>
        <Text style={styles.paragraph}>{data.latestItem.description}</Text>
        <Text style={styles.paragraphMuted}>{data.latestItem.timing}</Text>
      </Section>

      <Section title="Bans prioritarios">
        {data.bans.map((ban) => (
          <View key={ban.hero} style={styles.listItem}>
            <Pill tone={ban.priority === "Alta" ? "accent" : ban.priority === "Situacional" ? "default" : "success"}>
              {ban.priority}
            </Pill>
            <View style={styles.listCopy}>
              <Text style={styles.listTitle}>{ban.hero}</Text>
              <Text style={styles.paragraphMuted}>{ban.reason}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section title="Selecciones recomendadas">
        {data.priorityPicks.map((pick) => (
          <View key={pick.role} style={styles.pickCard}>
            <Text style={styles.listTitle}>{formatPickHeadline(pick)}</Text>
            <Text style={styles.paragraph}>{pick.plan}</Text>
            <View style={styles.pillRow}>
              {pick.heroes.map((hero) => (
                <Pill key={hero} tone="accent">
                  {hero}
                </Pill>
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title="Builds sugeridas">
        {data.builds.map((build) => (
          <View key={build.hero} style={styles.pickCard}>
            <Text style={styles.listTitle}>{build.hero}</Text>
            <Text style={styles.paragraphMuted}>Core</Text>
            <View style={styles.pillRow}>
              {build.coreItems.map((item) => (
                <Pill key={item}>{item}</Pill>
              ))}
            </View>
            <Text style={styles.paragraphMuted}>Situacional</Text>
            <View style={styles.pillRow}>
              {build.situationalItems.map((item) => (
                <Pill key={item}>{item}</Pill>
              ))}
            </View>
            <Text style={styles.paragraph}>{build.notes}</Text>
          </View>
        ))}
      </Section>

      <Section title="Notas rápidas">
        <View style={styles.pillRow}>
          {heroTagGroups.flat().map((hero) => (
            <Pill key={hero}>{hero}</Pill>
          ))}
        </View>
        {data.notes.map((note, index) => (
          <Text key={index} style={styles.paragraph}>
            • {note}
          </Text>
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 24,
  },
  version: {
    color: colors.accentSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  sectionHighlight: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8,
  },
  paragraph: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  paragraphMuted: {
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
    marginTop: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  listCopy: {
    flex: 1,
  },
  listTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  pickCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  errorSubtitle: {
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});