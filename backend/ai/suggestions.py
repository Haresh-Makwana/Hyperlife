import sys
import json

data = json.loads(sys.argv[1])

mood_sum = 0
energy_sum = 0
count = len(data)

suggestions = []

if count == 0:
    print(json.dumps(["No data available for analysis"]))
    exit()

for a in data:
    mood_sum += a["mood_level"]
    energy_sum += a["energy_level"]

avg_mood = mood_sum / count
avg_energy = energy_sum / count

if avg_mood < 6:
    suggestions.append("Your mood is often low. Try outdoor activities.")

if avg_energy < 6:
    suggestions.append("Your energy seems low. Improve sleep & hydration.")

if avg_energy > 7 and avg_mood > 7:
    suggestions.append("Your routine is healthy. Keep it up!")

print(json.dumps(suggestions))
