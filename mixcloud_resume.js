// Konfiguration
const IFRAME_ID = 'mixcloud-widget';
const LOCAL_STORAGE_KEY = 'mixcloud_last_time';

// --- 1. Initialisierung und Stand wiederherstellen ---

// Warten, bis das Mixcloud API Skript geladen ist
window.onload = function() {
    const iframe = document.getElementById(IFRAME_ID);
    
    // Erstelle ein Widget-Objekt, um mit dem Player zu kommunizieren
    const widget = Mixcloud.PlayerWidget(iframe);
    
    // Warten, bis der Player vollständig geladen ist
    widget.ready.then(function() {
        console.log("Mixcloud Widget ist bereit.");

        // 1. Gespeicherten Stand abrufen
        const gespeicherterStandString = localStorage.getItem(LOCAL_STORAGE_KEY);
        
        if (gespeicherterStandString) {
            const gespeicherterStandSekunden = parseFloat(gespeicherterStandString);
            
            // 2. Player zur letzten Position springen lassen
            widget.seek(gespeicherterStandSekunden).then(function() {
                console.log('Stream fortgesetzt ab: ' + gespeicherterStandSekunden + ' Sekunden.');
            });
        }
        
        // 3. Den Zeitstempel bei Wiedergabe überwachen (Speicher-Logik)
        setupTimeTracking(widget);
    });
};


// --- 2. Funktion zum Speichern des Zeitstempels ---

function setupTimeTracking(widget) {
    let lastTime = 0;
    
    // Event-Listener für das 'play' Event (Mix wird abgespielt)
    widget.events.play.on(function() {
        // Setze ein Intervall, das regelmäßig die Zeit abfragt und speichert
        // Wir speichern nur jede Sekunde, um die Performance zu schonen
        const intervalId = setInterval(async () => {
            const currentTime = await widget.getPosition();
            
            // Speichere nur, wenn der Mix wirklich läuft (currentTime > 0)
            if (currentTime > 0) {
                 localStorage.setItem(LOCAL_STORAGE_KEY, currentTime.toFixed(0)); // Auf ganze Sekunden runden
                 lastTime = currentTime;
            }
        }, 1000); // Alle 1000 Millisekunden (1 Sekunde) speichern

        // Beim Stoppen oder Wechseln das Intervall löschen und final speichern
        widget.events.pause.on(function() {
            clearInterval(intervalId);
            // Finalen Stand beim Pausieren speichern
            localStorage.setItem(LOCAL_STORAGE_KEY, lastTime.toFixed(0));
            console.log("Speichern gestoppt, letzter Stand: " + lastTime.toFixed(0));
        }, { once: true }); // Stopp-Listener nur einmal ausführen, er wird beim nächsten Play neu gesetzt
    });
}
