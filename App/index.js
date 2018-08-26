import React, { Component } from 'react';
import { Provider } from 'react-redux';
import configureStore from '../store';
import Bootstrap from './Bootstrap';
import Root from './components/Root';
import { setStore as setStoreForNavigationService } from './services/NavigationService';
import { setStore as setStoreForOrderService } from './services/OrderService';
import { setStore as setStoreForProductService } from './services/ProductService';
import { setStore as setStoreForTickerService } from './services/TickerService';
import { setStore as setStoreForTokenService } from './services/TokenService';
import {
  setStore as setStoreForTransactionWatcherService,
  start as startTransactionWatcherService
} from './services/TransactionWatcherService';
// import {
//   setStore as setStoreForServerTransactionWatcherService,
//   start as startServerTransactionWatcherService
// } from './services/ServerTransactionWatcherService';
import { setStore as setStoreForWalletService } from './services/WalletService';
import { setStore as setStoreForZeroExService } from './services/ZeroExService';

const store = configureStore();

setStoreForNavigationService(store);
setStoreForOrderService(store);
setStoreForProductService(store);
// setStoreForServerTransactionWatcherService(store);
setStoreForTickerService(store);
setStoreForTokenService(store);
setStoreForTransactionWatcherService(store);
setStoreForWalletService(store);
setStoreForZeroExService(store);

// startServerTransactionWatcherService();
startTransactionWatcherService();

export default class App extends Component {
  render() {
    return (
      <Root>
        <Provider store={store}>
          <Bootstrap />
        </Provider>
      </Root>
    );
  }
}
