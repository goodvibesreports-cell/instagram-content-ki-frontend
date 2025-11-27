export const toolDescriptions = {
  dashboard: {
    title: "Dashboard",
    description: "Das Dashboard bündelt Kennzahlen, Upload-Status und Tool-Schnellzugriffe in einer konsolidierten Ansicht. Es visualisiert Credits, generierte Inhalte und offene Aufgaben nahezu in Echtzeit. Die Oberfläche dient als Ausgangspunkt für Uploads, Batch-Prozesse und Kalenderplanung.",
    usageSteps: [
      "Dashboard öffnen und aktuelle Kennzahlen prüfen.",
      "Uploads, Batch-Generator oder Kalender direkt aus den Karten starten.",
      "Statusmeldungen zu Fehlern oder fehlenden Daten abarbeiten.",
      "Bei Bedarf in die Detail-Tools für Generierung oder Planung wechseln.",
      "Nach Abschluss erneut auf das Dashboard zurückkehren, um Effekte zu kontrollieren."
    ],
    example: "Das Team prüft morgens Credits und Upload-Status und startet anschließend den Batch Generator direkt aus dem Dashboard.",
    tips: [
      "Kennzahlen mindestens einmal täglich verifizieren.",
      "Warnmeldungen und Fehlerzustände sofort klären.",
      "Schnellzugriffe für wiederkehrende Prozesse nutzen."
    ]
  },
  creatorDNAWizard: {
    title: "Creator DNA Wizard",
    description: "Der Creator-DNA-Wizard sammelt Stilparameter, Beispiele und Ausschlusslisten, damit alle KI-Outputs konsistent bleiben. Er synchronisiert bestehende Profile und erlaubt jederzeitige Aktualisierungen. Die gespeicherten Angaben fließen automatisch in Prompts, Skripte und Caption-Generierung ein.",
    usageSteps: [
      "Vorhandene Profildaten laden oder neue Werte erfassen.",
      "Nische, Tonalität und Zielgruppe präzise definieren.",
      "Beispiele für Hooks, Captions und verbotene Begriffe eingeben.",
      "Creator Statement und besondere Anweisungen ergänzen.",
      "Formular speichern und zurück zum Dashboard wechseln."
    ],
    example: "Der Creator definiert Nische, Ton und verbotene Wörter, damit der Hook Generator automatisch im gewünschten Stil liefert.",
    tips: [
      "Beispiele regelmäßig aktualisieren, sobald neue Inhalte gut performen.",
      "Verbotene Wörter nur aufnehmen, wenn sie zwingend ausgeschlossen werden müssen.",
      "Änderungen sofort speichern, damit alle Tools die neuen Parameter nutzen."
    ]
  },
  history: {
    title: "Verlauf",
    description: "Der Verlauf protokolliert sämtliche Generierungen inklusive Typ, Zeitstempel und genutzter Prompt-Auszüge. Er dient als Nachschlagewerk für bereits erzeugte Inhalte und erleichtert Qualitätskontrollen. Die Historie kann gefiltert und für Audits genutzt werden.",
    usageSteps: [
      "Verlaufsseite öffnen und Einträge chronologisch prüfen.",
      "Bei Bedarf nach Typ oder Zeitraum filtern.",
      "Prompts oder Ergebnisse zur Wiederverwendung kopieren.",
      "Auffällige Einträge markieren und Feedback ableiten.",
      "Zurück zur Generierung wechseln, falls Anpassungen nötig sind."
    ],
    example: "Das Team identifiziert im Verlauf, welcher Prompt zuletzt die höchsten Engagement-Werte erzeugt hat.",
    tips: [
      "Nur relevante Einträge exportieren, um Informationsflut zu vermeiden.",
      "Regelmäßig prüfen, ob sich generierte Inhalte überschneiden.",
      "Bei Qualitätsproblemen zuerst den Verlauf analysieren."
    ]
  },
  batchGenerator: {
    title: "Batch Generator",
    description: "Der Batch Generator erstellt in einem Lauf zehn Prompts, zehn Hooks und zehn Captions zu einem Thema. Er bündelt sämtliche Eingaben und liefert strukturierte Ergebnisse zur Weiterverarbeitung. Der Prozess spart Credits gegenüber Einzelgenerierungen.",
    usageSteps: [
      "Thema, Nische und Sprache definieren.",
      "Batch-Anfrage absenden und Generierung abwarten.",
      "Ergebnisblöcke (Prompts, Hooks, Captions) prüfen.",
      "Relevante Inhalte kopieren oder in den Kalender übertragen.",
      "Credits-Stand nach dem Batch-Lauf kontrollieren."
    ],
    example: "Das Marketing-Team generiert einmal pro Woche ein Paket aus zehn Prompts, Hooks und Captions für kommende Kampagnen.",
    tips: [
      "Das Thema möglichst spezifisch formulieren, um Dubletten zu vermeiden.",
      "Batch-Ergebnisse direkt in Kalendereinträge überführen.",
      "Bei komplexen Kampagnen mehrere Batch-Läufe mit unterschiedlichen Nischen ausführen."
    ]
  },
  promptGenerator: {
    title: "Prompt Generator",
    description: "Der Prompt Generator erstellt virale Reel-Prompts basierend auf Kategorie, Stil und Sprache. Er berücksichtigt Creator-DNA-Einstellungen und gibt strukturierte Vorschläge aus. Jeder Lauf verbraucht exakt die im Interface ausgewiesenen Credits.",
    usageSteps: [
      "Kategorie und Stil auswählen oder eingeben.",
      "Variantenanzahl und Sprache konfigurieren.",
      "Generierung starten und Ergebnis prüfen.",
      "Prompts kopieren oder direkt an den Batch-Plan übergeben.",
      "Feedback aus der Performance in zukünftige Eingaben einfließen lassen."
    ],
    example: "Der Social-Media-Lead generiert drei Prompts im Stil 'Viral' für die Kategorie Fitness.",
    tips: [
      "Kleinere Variantenanzahl wählen, wenn nur Inspiration benötigt wird.",
      "Ton und Stil an Creator-DNA ausrichten, um Nachbearbeitung zu reduzieren.",
      "Ergebnisse archivieren, sobald sie in Kampagnen überführt wurden."
    ]
  },
  scriptGenerator: {
    title: "Script Generator",
    description: "Der Script Generator erzeugt detaillierte Videoideen inklusive Struktur, Voiceover und Text-Overlays. Er verarbeitet einen thematischen Prompt und liefert formatierte Ausgaben für Reels oder Shorts. Die Ergebnisse enthalten Hook, Handlung und CTA-Blöcke.",
    usageSteps: [
      "Klares Thema oder Prompt beschreiben.",
      "Generierung auslösen und Antwort abwarten.",
      "Einzelne Szenen und Voiceover prüfen.",
      "Passagen nach Bedarf in den Kalender oder Editor kopieren.",
      "Feedback aus Performance-Metriken zurückspielen."
    ],
    example: "Der Content Strategist lässt für einen Produkt-Launch ein vollständiges Reelscript mit Hook, Handlung und CTA generieren.",
    tips: [
      "Prompts präzise formulieren, um zielgerichtete Szenen zu erhalten.",
      "CTA und Hook bei Bedarf manuell auf Marke oder Kampagne zuschneiden.",
      "Skripte mit Creator-DNA und Kalender synchronisieren."
    ]
  },
  hookGenerator: {
    title: "Hook Generator",
    description: "Der Hook Generator liefert scroll-stoppende Einstiege auf Basis von Thema, Stil und gewünschter Anzahl. Er nutzt Creator-DNA-Parameter und produziert kompakte Textbausteine für Reels, Shorts oder Ads. Die Ausgabe lässt sich direkt weiterverwenden.",
    usageSteps: [
      "Thema und optional Stil auswählen.",
      "Anzahl der Hooks definieren.",
      "Generierung starten und Vorschläge prüfen.",
      "Starke Hooks kopieren und testen.",
      "Erfolgreiche Hooks im Verlauf dokumentieren."
    ],
    example: "Die Performance-Marketing-Managerin erzeugt zehn Hooks im Stil 'Shocking' für eine TikTok-Kampagne.",
    tips: [
      "Nicht mehr Hooks generieren als tatsächlich getestet werden können.",
      "Hooks mit hoher Performance im Creator-DNA-Wizard hinterlegen.",
      "Unterperformende Hooks analysieren und Prompt präzisieren."
    ]
  },
  captionGenerator: {
    title: "Caption Generator",
    description: "Der Caption Generator erstellt Instagram-Captions inklusive Hashtags unter Berücksichtigung von Thema, Ton und gewünschter Anzahl. Er ergänzt Emojis nur gemäß Stilvorgaben aus der Creator-DNA. Jede Ausgabe ist sofort veröffentlichungsfähig.",
    usageSteps: [
      "Thema und Ton auswählen.",
      "Anzahl festlegen und Generierung starten.",
      "Captions auf Plattform-Policy prüfen.",
      "Geeignete Varianten kopieren oder speichern.",
      "Feedback aus Reichweite und Engagement einpflegen."
    ],
    example: "Der Social-Media-Manager generiert drei professionelle Captions für eine B2B-Case-Study.",
    tips: [
      "Tonwahl konsequent an der Zielgruppe ausrichten.",
      "Nur benötigte Anzahl generieren, um Credits zu sparen.",
      "Hashtag-Listen regelmäßig mit Insight-Daten abgleichen."
    ]
  },
  titleGenerator: {
    title: "Title Generator",
    description: "Der Title Generator entwirft klickstarke Video-Titel auf Basis von Thema, Stil und gewünschter Menge. Er optimiert die Formulierungen für kurze Social-Video-Formate. Die Ergebnisse können direkt auf Reels, Shorts oder Ads angewendet werden.",
    usageSteps: [
      "Thema und Stil auswählen.",
      "Anzahl festlegen und Generierung auslösen.",
      "Titel nach Kanalanforderungen prüfen.",
      "Varianten testen und Performance messen.",
      "Erfolgreiche Titel in Templates übernehmen."
    ],
    example: "Das Growth-Team erstellt fünf How-To-Titel für eine neue YouTube-Shorts-Serie.",
    tips: [
      "Stil konsistent an Kampagnenziel koppeln.",
      "Titel vor Veröffentlichung auf Richtlinien prüfen.",
      "Winning-Titel dokumentieren und wiederverwenden."
    ]
  },
  trendFinder: {
    title: "Trend Finder",
    description: "Der Trend Finder analysiert aktuelle Themen, Sounds und Formate basierend auf Nische, Plattform und Zeitraum. Er liefert priorisierte Trendhinweise zur schnellen Content-Adaptierung. Die Ergebnisse dienen als Input für Hooks, Skripte und Kalenderplanung.",
    usageSteps: [
      "Nische, Plattform und Zeitraum definieren.",
      "Analyse starten und Auswertung lesen.",
      "Relevante Trends markieren und in Tasks überführen.",
      "Nicht relevante Trends verwerfen, um Fokus zu halten.",
      "Ausgewählte Trends mit Generator-Tools umsetzen."
    ],
    example: "Der Strategist analysiert wöchentlich die TikTok-Trends für die Finanznische, um neue Hooks abzuleiten.",
    tips: [
      "Trends zeitnah prüfen, da sie schnell an Relevanz verlieren.",
      "Ausgabe direkt mit Creator-DNA und Kalender verknüpfen.",
      "Nur Trends verfolgen, die zur Zielgruppe passen."
    ]
  },
  viralityCheck: {
    title: "Virality Check",
    description: "Der Virality Check bewertet Hooks, Captions oder Skripte hinsichtlich viralen Potenzials. Er liefert strukturierte Einschätzungen zu Hook-Stärke, Klarheit, CTA und Verbesserungsvorschlägen. Die Analyse unterstützt Feinschliff vor Veröffentlichung.",
    usageSteps: [
      "Content-Typ auswählen und Text einfügen.",
      "Analyse starten und Bewertung abwarten.",
      "Empfehlungen priorisieren und umsetzen.",
      "Bei Bedarf erneute Prüfung durchführen.",
      "Feedback aus Live-Daten zurückspielen."
    ],
    example: "Das Team überprüft eine Caption mit dem Virality Check und optimiert CTA sowie Hook vor dem Release.",
    tips: [
      "Analysetexte nicht länger als nötig formulieren, um klare Ergebnisse zu erhalten.",
      "Empfehlungen zeitnah anwenden, solange Kampagne noch geplant ist.",
      "Ergebnisse mit späteren Performance-Daten vergleichen."
    ]
  },
  team: {
    title: "Team Verwaltung",
    description: "Die Teamverwaltung steuert Organisationen, Einladungen und Mitgliederlimits. Sie erlaubt das Erstellen neuer Teams, das Versenden von Einladungen und das Überwachen der Auslastung. Alle Änderungen wirken sofort auf Berechtigungen und Credits.",
    usageSteps: [
      "Vorhandene Organisation prüfen oder neues Team anlegen.",
      "Teamname und Mitgliederlimit kontrollieren.",
      "Einladungen per E-Mail versenden und Status verfolgen.",
      "Überflüssige Nutzer entfernen oder Rollen anpassen.",
      "Änderungen speichern und auf Rückmeldungen warten."
    ],
    example: "Der Workspace-Admin legt ein neues Team an und lädt Content, Design und Paid-Media Leads ein.",
    tips: [
      "Nur notwendige Nutzer einladen, um Credits zu schützen.",
      "Teamstruktur regelmäßig überprüfen, wenn Rollen wechseln.",
      "Einladungsstatus nachfassen, falls Nutzer nicht reagieren."
    ]
  },
  assistant: {
    title: "KI-Assistent",
    description: "Der KI-Assistent sammelt Stilparameter, Emoji-Nutzung und spezielle Anweisungen für alle Generierungen. Die Einstellungen werden zentral gespeichert und automatisch auf Prompts, Skripte und Captions angewandt. Änderungen greifen unmittelbar nach dem Speichern.",
    usageSteps: [
      "Nische, Zielgruppe und Ton angeben.",
      "Emoji- und Hashtag-Stil definieren.",
      "Beispielinhalte oder verbotene Begriffe ergänzen.",
      "Custom Instructions formulieren und speichern.",
      "Auswirkung in den Generator-Tools kontrollieren."
    ],
    example: "Die Brand-Managerin hinterlegt im Assistenten, dass alle Inhalte in einem sachlichen Ton mit minimalen Emojis ausgegeben werden sollen.",
    tips: [
      "Nur klare, messbare Anweisungen hinterlegen.",
      "Nach größeren Kampagnen die Einstellungen überprüfen.",
      "Bei Testkampagnen separate Profile in Betracht ziehen."
    ]
  },
  settings: {
    title: "Einstellungen",
    description: "Die Einstellungen verwalten Standardsprachen, Benachrichtigungspräferenzen und globale Defaults. Änderungen gelten für alle Tools und Nutzer des Accounts. Der Bereich stellt sicher, dass Workflows einheitlich bleiben.",
    usageSteps: [
      "Aktuelle Standards prüfen.",
      "Gewünschte Sprache oder Option auswählen.",
      "Änderungen speichern und Rückmeldung abwarten.",
      "Bei Bedarf weitere Präferenzen definieren.",
      "Funktion prüfen, indem ein Tool erneut gestartet wird."
    ],
    example: "Der Workspace-Owner setzt die Standard-Sprache auf Englisch, damit internationale Teams gleiche Defaults nutzen.",
    tips: [
      "Nur Einstellungen ändern, deren Wirkung verstanden wird.",
      "Nach Updates kontrollieren, ob alle Nutzer Zugriff haben.",
      "Standards dokumentieren, um Workflows zu vereinheitlichen."
    ]
  },
  credits: {
    title: "Credits kaufen",
    description: "Der Credits-Bereich stellt Pakete für zusätzliche Generierungen bereit. Er zeigt verfügbare Angebote, Preise und inkludierte Kontingente. Nach dem Kauf stehen die Credits sofort für alle Tools zur Verfügung.",
    usageSteps: [
      "Aktuelle Credits prüfen.",
      "Passendes Paket auswählen.",
      "Zahlungsprozess abschließen (nach Verfügbarkeit).",
      "Freigeschaltete Credits im Dashboard kontrollieren.",
      "Nutzung planen, um Engpässe zu vermeiden."
    ],
    example: "Das Team bucht das Pro-Paket mit 500 Credits, um den monatlichen Kampagnenplan abzudecken.",
    tips: [
      "Verbrauch pro Woche tracken, um Pakete rechtzeitig nachzukaufen.",
      "Nur benötigte Pakete kaufen, um Kapitalbindung zu vermeiden.",
      "Nach jedem Kauf Credits im Dashboard validieren."
    ]
  },
  upload: {
    title: "Upload-Bereich",
    description: "Der Upload-Bereich verarbeitet TikTok- und Meta-JSON-Exporte, extrahiert relevante Posts und berechnet Benchmarks. Er akzeptiert ausschließlich Dateien mit echten Storage-Links und ignoriert Watch-History-Daten. Nach dem Upload stehen Analyse-Insights und Datensätze für weitere Tools bereit.",
    usageSteps: [
      "JSON-Export aus dem jeweiligen Netzwerk herunterladen.",
      "Datei im Upload-Bereich auswählen und hochladen.",
      "Verarbeitungsstatus abwarten und Ergebnis prüfen.",
      "Analyse-Ausgabe und Links kontrollieren.",
      "Datensatz in Upload Analyzer oder Kalender verwenden."
    ],
    example: "Das Insights-Team lädt den TikTok-Export der letzten 90 Tage hoch und erhält automatisch die Analyse zu Best Posting Times.",
    tips: [
      "Nur vollständige Exporte verwenden, um Leerfelder zu vermeiden.",
      "Watch-History-Dateien vor dem Upload aussortieren.",
      "Nach jedem Upload die ignored-links-Kennzahl prüfen."
    ]
  }
};



