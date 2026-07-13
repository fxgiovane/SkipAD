<p align="center">
  <img src="icons/icon128.png" width="80" alt="Pular Anúncios">
</p>

<h1 align="center">Pular Anúncios / SkipAD</h1>

<p align="center">
  Extensão Chrome para pular anúncios automaticamente e acelerar comerciais não puláveis no YouTube.
  <br>
  <i>Chrome extension to automatically skip ads and speed up non-skippable commercials on YouTube.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/versão-1.0.0-8b5cf6?style=flat-square" alt="Versão 1.0.0">
  <img src="https://img.shields.io/badge/licença-MIT-green?style=flat-square" alt="MIT">
  <img src="https://img.shields.io/badge/idiomas-18-orange?style=flat-square" alt="i18n">
</p>

---

## Português

O YouTube exibe anúncios que interrompem a reprodução. Esta extensão detecta instantaneamente o estado de anúncio do player do YouTube, clica de forma rápida nos botões de pulo e acelera anúncios não puláveis (silenciados) até o final.

### Instalação manual

1. Baixe o código do repositório e extraia onde preferir.
2. Acesse `chrome://extensions` no navegador Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** (canto superior esquerdo).
5. Selecione a pasta do projeto.
6. Abra o YouTube e clique no ícone da extensão para ver as métricas.

### Como funciona

- **Pulo Automático:** Monitora o player do YouTube e clica programaticamente no botão de pular anúncios no mesmo milissegundo em que ele se torna visível.
- **Aceleração 16x:** Se for um anúncio não pulável, o script acelera a reprodução da tag `<video>` para 16x (velocidade máxima permitida pelo navegador). O anúncio de 5s termina em ~0.3s.
- **Silenciamento Nativos:** O vídeo é mutado dinamicamente durante todo o anúncio e o som original do usuário é restaurado no término da propaganda.
- **Contador no Painel:** O número total de blocos de anúncios evitados é registrado de forma persistente.

### Proteções

| Nome | Função |
|------|--------|
| Anti-Reset Guard | Bloqueia tentativas do player do YouTube de reduzir a velocidade (16x) ou reativar o áudio do anúncio. |
| Circuit Breaker | Desliga loops e MutationObservers se ocorrerem 5 falhas consecutivas de reprodução, reiniciando o script 5s após resfriamento. |
| SPA Navigation Safe | Se adapta a navegações assíncronas do YouTube sem necessidade de recarregar a página (F5). |
| Safe Ending Seek | Avança o tempo do anúncio para `duration - 0.1` de forma segura (ignora lives) para forçar o fechamento sem quebras no player. |

---

## English

YouTube displays ads that interrupt your playback. This extension instantly detects the ad-showing state of the YouTube player, clicks skip buttons at high speed, and fast-forwards non-skippable commercials (muted) to the end.

### Manual install

1. Download the repository source code and extract it.
2. Go to `chrome://extensions` in your Chrome browser.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** (top left).
5. Select the project folder.
6. Open YouTube and click the extension icon to view statistics.

### How it works

- **Auto Skip:** Watches the YouTube player and clicks the skip button programmatically the exact millisecond it becomes visible.
- **16x Speed:** If it is a non-skippable ad, the script speeds up the `<video>` playback rate to 16x (maximum allowed by the browser). A 5s ad finishes in ~0.3s.
- **Native Muting:** The video is dynamically muted during the ad, and the user's original volume is restored upon ad completion.
- **Dashboard Counter:** The total number of avoided ad blocks is recorded and persist in the storage.

---

## Estrutura / Structure

```
content.js      Lógica principal e anti-reset / Main logic and anti-reset
popup.html      Interface do popup com vidro e neon / Popup UI
popup.js        Lógica de controle e tradução / Control logic and i18n
manifest.json   Manifest V3 de permissões mínimas
_locales/       18 idiomas (pt_BR, en, es, fr, de, it, ja, ko, zh_CN...)
icons/          Ícones transparentes PNG (16, 32, 48, 128px)
utils/          Assets promocionais de Web Store
```

## Licença / License

MIT
