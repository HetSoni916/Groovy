import subprocess
import os

STOCK_DIR = os.path.join(os.path.dirname(__file__), "storage", "stock_footage")
os.makedirs(STOCK_DIR, exist_ok=True)

clips = [
    ("ocean_waves.mp4", "0x1a5276", "ocean,waves,water,calm,peaceful"),
    ("city_skyline.mp4", "0x333344", "city,skyline,urban,luxury"),
    ("sunset_clouds.mp4", "0xFF6347", "sunset,clouds,sky,romantic,calm"),
    ("city_traffic.mp4", "0xFF8C00", "city,traffic,urban,energetic"),
    ("waterfall.mp4", "0x00CED1", "waterfall,nature,water,adventure,calm"),
    ("coffee_shop.mp4", "0x8B4513", "coffee,shop,cozy,calm,romantic"),
    ("drone_aerial.mp4", "0x228B22", "drone,aerial,landscape,adventure,epic"),
    ("fire_flames.mp4", "0xFF4500", "fire,flames,warm,dramatic,energetic"),
    ("snow_mountains.mp4", "0xADD8E6", "snow,mountains,winter,adventure,epic"),
    ("beach_sunset.mp4", "0xFFA07A", "beach,sunset,ocean,romantic,calm"),
    ("forest_path.mp4", "0x006400", "forest,path,nature,calm,peaceful"),
    ("light_bokeh.mp4", "0xFFD700", "light,bokeh,abstract,romantic,calm"),
    ("drone_city.mp4", "0x4169E1", "drone,city,urban,aerial,adventure"),
    ("night_lights.mp4", "0x191970", "night,lights,city,luxury,dramatic"),
    ("green_meadow.mp4", "0x32CD32", "green,meadow,nature,calm,peaceful"),
]

for name, color, tags in clips:
    out_path = os.path.join(STOCK_DIR, name)
    if os.path.exists(out_path):
        print(f"SKIP: {name}")
        continue

    duration = 8
    filter_str = f"color=c={color}:s=1920x1080:d={duration}:r=30,format=yuv420p"

    cmd = [
        "ffmpeg", "-y", "-f", "lavfi", "-i", filter_str,
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-t", str(duration), out_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            size_mb = round(os.path.getsize(out_path) / (1024 * 1024), 1)
            print(f"OK: {name} ({size_mb} MB)")
        else:
            print(f"FAIL: {name}")
    except Exception as e:
        print(f"FAIL: {name} - {e}")

print("\nAll stock clips:")
for f in sorted(os.listdir(STOCK_DIR)):
    if f.endswith(".mp4"):
        size = round(os.path.getsize(os.path.join(STOCK_DIR, f)) / (1024 * 1024), 1)
        print(f"  {f} ({size} MB)")
