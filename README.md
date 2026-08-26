# Magazyn

Aplikacja magazynowa (Electron + React + TypeScript) do obsługi przyjęć (PZ) i
wydań (WZ): generuje karty PDF i dokumenty CMR oraz dopisuje pozycje do
`magazyn.xlsx`. Zobacz `CLAUDE.md` po pełny opis architektury.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

Ten projekt targetuje wyłącznie Windows.

```bash
# Instalator NSIS + wersja portable (wymaga Wine poza Windows)
$ npm run build:win

# Zbudowany, niespakowany katalog (dist/win-unpacked) — bez instalatora,
# działa też bez Wine na Linuksie/WSL2
$ npm run build:unpack
```
