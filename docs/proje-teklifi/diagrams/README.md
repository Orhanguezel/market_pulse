# MatPortal — Diyagram ve Wireframe Klasörü

Bu klasör projenin görsellerini içerir:
- **Mimari diyagramlar** (Excalidraw kaynak + PNG export)
- **Kullanıcı yolculuğu wireframe'leri** (Excalidraw)
- **Veri akışı şemaları**

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `01-mimari-7-katman.excalidraw` | 7 katmanlı genel mimari |
| `02-veri-akisi.excalidraw` | Tüm sistem veri akışı |
| `03-bayi-yolculuk-sipariş.excalidraw` | Bayi ilk sipariş wireframe |
| `04-yonetici-tahmin-dashboard.excalidraw` | Tahmin motoru dashboard |
| `05-bayi-radari-heatmap.excalidraw` | Churn radarı heatmap |
| `06-zaman-cizelgesi-gantt.excalidraw` | 11 fazlı Gantt |
| `07-risk-matrisi.excalidraw` | Olasılık × etki risk grid |
| `08-roi-grafik.excalidraw` | Aylık ROI projeksiyonu |
| `09-saha-mobil-akis.excalidraw` | Saha satış mobil ziyaret formu |
| `10-konversasyonel-sohbet.excalidraw` | Yönetici sohbet UI |

## Excalidraw Nasıl Açılır

1. https://excalidraw.com/ adresine git (ücretsiz, açık kaynak)
2. Sol üst köşede "Open" → ilgili `.excalidraw` dosyasını yükle
3. Düzenle, kaydet, PNG/SVG export et

VS Code Excalidraw extension da mevcut: `pomdtr.excalidraw-editor`.

## PNG Export

```bash
# Excalidraw CLI (npm)
npx --yes @excalidraw/excalidraw-export 01-mimari-7-katman.excalidraw \
    --output 01-mimari-7-katman.png \
    --background \
    --scale 2
```

## Versiyon Kontrolü

- `.excalidraw` dosyaları (kaynak) → Git'e commitlenir
- `.png` export'ları → İhtiyaca göre commitlenir (büyük dosyalarsa Git LFS)

## Diyagram Standartları

- **Renk paleti** Promats marka renklerine uyumlu
- **Yazı tipi:** Default Excalidraw (Cascadia / Virgil)
- **Boyut:** 1920×1080 max (sunum için)
- **Etiketler:** Türkçe
- **Modüller:** Renk-kodlu (ERP=mavi, MatPortal=yeşil, AI=mor)
