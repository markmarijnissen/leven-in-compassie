# leven-in-compassie

levenincompassie.nl website

Build using **webpack** and **harpjs**

### Install
```bash
npm install webpack harp -g
npm install
```

### Development
```bash
webpack --watch
harp server
```

### Production
```bash
npm run production
```

which is the same as

```bash
webpack --minify && harp compile
```
