import cv2
import numpy as np

MIN_FIRE_AREA = 800
MIN_SMOKE_AREA = 3000
MIN_CONFIDENCE = 0.50
MAX_FIRE_DETECTIONS = 3
MAX_SMOKE_DETECTIONS = 2


def _components(mask, min_area):
    num_labels, _, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    regions = []

    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        if area < min_area:
            continue

        x = stats[label, cv2.CC_STAT_LEFT]
        y = stats[label, cv2.CC_STAT_TOP]
        w = stats[label, cv2.CC_STAT_WIDTH]
        h = stats[label, cv2.CC_STAT_HEIGHT]
        regions.append((area, [float(x), float(y), float(x + w), float(y + h)]))

    regions.sort(key=lambda item: item[0], reverse=True)
    return regions


def _water_mask(img, hsv):
    """Exclude water — blue/cyan tones and muddy low-saturation ground."""
    blue, green, red = cv2.split(img)

    blue_dominant = (blue.astype(np.int16) - red.astype(np.int16) > 12) & (
        blue.astype(np.int16) - green.astype(np.int16) > 5
    )

    mask_blue = cv2.inRange(hsv, np.array([80, 25, 35]), np.array([135, 255, 230]))
    mask_teal = cv2.inRange(hsv, np.array([70, 15, 30]), np.array([95, 100, 180]))
    mask_muddy = cv2.inRange(hsv, np.array([5, 20, 35]), np.array([30, 95, 170]))

    water = mask_blue | mask_teal | mask_muddy
    water[blue_dominant] = 255

    kernel = np.ones((9, 9), np.uint8)
    return cv2.dilate(water, kernel, iterations=1)


def _fire_color_mask(hsv):
    """Flame-colored pixels — tighter thresholds to avoid dull reflections."""
    lower_orange = np.array([8, 110, 150])
    upper_orange = np.array([35, 255, 255])
    lower_red1 = np.array([0, 110, 150])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 110, 150])
    upper_red2 = np.array([180, 255, 255])

    return (
        cv2.inRange(hsv, lower_orange, upper_orange)
        | cv2.inRange(hsv, lower_red1, upper_red1)
        | cv2.inRange(hsv, lower_red2, upper_red2)
    )


def _validate_fire_region(hsv, fire_mask, bbox):
    """Reject water, mud, and weak orange reflections."""
    x1, y1, x2, y2 = [int(v) for v in bbox]
    roi_hsv = hsv[y1:y2, x1:x2]
    roi_fire = fire_mask[y1:y2, x1:x2]

    fire_pixels = roi_hsv[roi_fire > 0]
    if len(fire_pixels) < 50:
        return False, 0.0

    saturation = fire_pixels[:, 1].astype(float)
    value = fire_pixels[:, 2].astype(float)

    sat_mean = saturation.mean()
    val_mean = value.mean()
    hot_ratio = np.sum((saturation > 140) & (value > 190)) / len(fire_pixels)

    # Real flames are bright and saturated; water/mud is duller.
    if sat_mean < 115 or val_mean < 145:
        return False, 0.0
    if hot_ratio < 0.12:
        return False, 0.0

    fill_ratio = float(np.sum(roi_fire > 0)) / roi_fire.size
    confidence = float(min(0.98, 0.45 + hot_ratio * 0.35 + fill_ratio * 0.25))
    return confidence >= MIN_CONFIDENCE, confidence


def _confidence_from_mask(mask, bbox):
    x1, y1, x2, y2 = [int(v) for v in bbox]
    roi = mask[y1:y2, x1:x2]
    if roi.size == 0:
        return 0.0

    fill_ratio = float(np.sum(roi > 0)) / roi.size
    return float(min(0.98, 0.5 + fill_ratio * 0.45))


def detect_fire_smoke(image_path):
    """
    Supplemental fire/smoke detection using color analysis.
    Standard YOLOv8 COCO weights do not include fire or smoke classes.
    """
    img = cv2.imread(image_path)
    if img is None:
        return []

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    kernel = np.ones((7, 7), np.uint8)

    mask_fire = _fire_color_mask(hsv)
    mask_fire = cv2.bitwise_and(mask_fire, cv2.bitwise_not(_water_mask(img, hsv)))
    mask_fire = cv2.morphologyEx(mask_fire, cv2.MORPH_CLOSE, kernel)
    mask_fire = cv2.morphologyEx(mask_fire, cv2.MORPH_OPEN, kernel)

    detections = []

    for _, bbox in _components(mask_fire, MIN_FIRE_AREA)[: MAX_FIRE_DETECTIONS * 2]:
        valid, confidence = _validate_fire_region(hsv, mask_fire, bbox)
        if valid:
            detections.append({"label": "fire", "confidence": confidence, "bbox": bbox})
        if len(detections) >= MAX_FIRE_DETECTIONS:
            break

    lower_smoke = np.array([0, 0, 25])
    upper_smoke = np.array([180, 70, 210])
    mask_smoke = cv2.inRange(hsv, lower_smoke, upper_smoke)
    mask_smoke = cv2.bitwise_and(mask_smoke, cv2.bitwise_not(mask_fire))
    mask_smoke = cv2.bitwise_and(mask_smoke, cv2.bitwise_not(_water_mask(img, hsv)))
    mask_smoke = cv2.morphologyEx(mask_smoke, cv2.MORPH_CLOSE, kernel)

    for _, bbox in _components(mask_smoke, MIN_SMOKE_AREA)[:MAX_SMOKE_DETECTIONS]:
        x1, y1, x2, y2 = bbox
        width = x2 - x1
        height = y2 - y1
        if height / max(width, 1) < 1.0:
            continue

        confidence = _confidence_from_mask(mask_smoke, bbox)
        if confidence >= MIN_CONFIDENCE:
            detections.append(
                {"label": "smoke", "confidence": confidence, "bbox": bbox}
            )

    return detections
