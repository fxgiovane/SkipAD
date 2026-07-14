<p align="center">
  <img src="icons/icon128.png" width="80" alt="SkipAD">
</p>

<h1 align="center">SkipAD</h1>

<p align="center">
  Pula anúncios automaticamente e acelera comerciais não puláveis no YouTube.
  <br>
  <i>Automatically skip ads and speed up non-skippable commercials on YouTube.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/versão-1.2.0-8b5cf6?style=flat-square" alt="Versão 1.2.0">
  <img src="https://img.shields.io/badge/licença-MIT-green?style=flat-square" alt="MIT">
  <img src="https://img.shields.io/badge/idiomas-18-orange?style=flat-square" alt="i18n">
</p>

---

## Português

Extensão leve que monitora o player do YouTube para pular propagandas imediatamente e acelerar as que não podem ser puladas.

### Como instalar

1. Baixe o código deste repositório.
2. Acesse `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.

### Recursos

- **Pulo Instantâneo:** Clica nos botões de pular no mesmo instante em que aparecem no DOM.
- **Aceleração 16x:** Aumenta a velocidade de reprodução para 16x em anúncios obrigatórios. Um comercial de 5 segundos termina em 0.3 segundos.
- **Mute Automático:** Silencia o áudio durante a propaganda e restaura o volume original do usuário após o término.
- **Circuit Breaker:** Desativa o monitoramento se ocorrerem erros persistentes para poupar CPU, reiniciando o loop após 5 segundos.
- **Suporte SPA:** Funciona durante a navegação entre vídeos sem precisar recarregar a página.

---

## English

Lightweight extension that monitors the YouTube player to skip ads immediately and speed up non-skippable ones.

### How to install

1. Download the repository source code.
2. Go to `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.

### Features

- **Instant Skip:** Clicks skip buttons the exact moment they appear in the DOM.
- **16x Speed:** Speeds up non-skippable ads to 16x. A 5-second commercial ends in 0.3 seconds.
- **Auto Mute:** Mutes the ad volume and restores the user's original volume afterward.
- **Circuit Breaker:** Stops execution after persistent errors to save CPU, retrying after 5 seconds.
- **SPA Safe:** Works across video navigations without requiring page reloads.

---

## Estrutura / Structure

```
content.js      Lógica principal e interceptação de eventos / Core logic and event interception
popup.html      Interface visual / Popup UI
popup.js        Lógica de controle e locales / Control logic and i18n
manifest.json   Manifest V3
_locales/       Suporte a 18 idiomas / 18 locales supported
icons/          Ícones (16, 32, 48, 128px)
utils/          Assets promocionais
```

## Licença / License

MIT
