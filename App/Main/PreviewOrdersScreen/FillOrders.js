import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-native';
import { ListItem, Text } from 'react-native-elements';
import { connect } from 'react-redux';
import { colors, getProfitLossStyle } from '../../../styles';
import { loadOrders } from '../../../thunks';
import Button from '../../components/Button';
import TwoColumnListItem from '../../components/TwoColumnListItem';
import FormattedTokenAmount from '../../components/FormattedTokenAmount';
import Row from '../../components/Row';
import NavigationService from '../../services/NavigationService';
import {
  convertZeroExOrderToLimitOrder,
  fillOrders,
  getAveragePrice
} from '../../services/OrderService';
import { getAdjustedBalanceByAddress } from '../../services/WalletService';
import Loading from './Loading';

class Order extends Component {
  render() {
    const { limitOrder, base, quote, highlight, ...rest } = this.props;
    const { amount, price } = limitOrder;

    return (
      <ListItem
        checkmark={highlight}
        title={
          <Row style={[{ flex: 1 }]}>
            <FormattedTokenAmount amount={amount} symbol={base.symbol} />
            <Text> </Text>
            <FormattedTokenAmount amount={price} symbol={quote.symbol} />
          </Row>
        }
        bottomDivider
        {...rest}
      />
    );
  }
}

Order.propTypes = {
  limitOrder: PropTypes.object.isRequired,
  base: PropTypes.object.isRequired,
  quote: PropTypes.object.isRequired,
  highlight: PropTypes.bool
};

class PreviewFillOrders extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showFilling: false,
      receipt: null
    };
  }

  UNSAFE_componentWillMount() {
    const {
      navigation: {
        state: {
          params: { side }
        }
      }
    } = this.props;

    if (side !== 'buy' && side !== 'sell') {
      return NavigationService.goBack();
    }
  }

  async componentDidMount() {
    this.props.dispatch(loadOrders());
    this.setState({ receipt: await this.getReceipt() });
  }

  render() {
    if (this.state.showFilling) {
      return <Loading text={'Filling orders'} />;
    }

    if (!this.state.receipt) return null;

    const {
      navigation: {
        state: {
          params: {
            product: { quote, base },
            orders,
            side
          }
        }
      }
    } = this.props;

    const { priceAverage, subtotal, fee, total } = this.state.receipt;
    const funds = getAdjustedBalanceByAddress(quote.address);
    const fundsAfterOrder = funds.add(total);

    return (
      <View style={{ width: '100%', height: '100%', flex: 1, marginTop: 50 }}>
        <TwoColumnListItem
          left="Average Price"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={priceAverage}
              symbol={quote.symbol}
              style={[styles.tokenAmountRight]}
            />
          }
          bottomDivider={false}
        />
        <TwoColumnListItem
          left="Sub-Total"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={subtotal}
              symbol={quote.symbol}
              style={[styles.tokenAmountRight]}
            />
          }
          bottomDivider={false}
        />
        <TwoColumnListItem
          left="Fee"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={fee}
              symbol={quote.symbol}
              style={[styles.tokenAmountRight]}
            />
          }
          bottomDivider={false}
        />
        <TwoColumnListItem
          left="Total"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={total}
              symbol={quote.symbol}
              style={[
                styles.tokenAmountRight,
                getProfitLossStyle(total.toNumber())
              ]}
            />
          }
          rowStyle={{ marginTop: 10 }}
          bottomDivider={true}
          topDivider={true}
        />
        <TwoColumnListItem
          left="Funds Available"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={funds}
              symbol={quote.symbol}
              style={[styles.tokenAmountRight]}
            />
          }
          rightStyle={{ height: 30 }}
          rowStyle={{ marginTop: 10 }}
          bottomDivider={true}
        />

        <TwoColumnListItem
          left="Funds After Filling Orders"
          leftStyle={{ height: 30 }}
          right={
            <FormattedTokenAmount
              amount={fundsAfterOrder}
              symbol={quote.symbol}
              style={[
                styles.tokenAmountRight,
                getProfitLossStyle(total.toNumber())
              ]}
            />
          }
          rightStyle={{ height: 30 }}
          rowStyle={{ marginTop: 10 }}
          bottomDivider={true}
        />
        <Button
          large
          onPress={() => this.submit()}
          title={this.getButtonTitle()}
        />
        {orders.map((o, i) => (
          <Order
            key={o.orderHash || o.hash || i}
            limitOrder={convertZeroExOrderToLimitOrder(
              o,
              side === 'buy' ? 'sell' : 'buy'
            )}
            base={base}
            quote={quote}
            highlight={true}
          />
        ))}
      </View>
    );
  }

  getButtonTitle() {
    switch (this.props.navigation.state.params.side) {
      case 'buy':
        return 'Confirm Buy';

      case 'sell':
        return 'Confirm Sell';

      default:
        return null;
    }
  }

  getMakerToken() {
    const {
      navigation: {
        state: {
          params: {
            product: { quote, base },
            side
          }
        }
      }
    } = this.props;

    if (side === 'buy') {
      return quote;
    } else if (side === 'sell') {
      return base;
    } else {
      return null;
    }
  }

  getTakerToken() {
    const {
      navigation: {
        state: {
          params: {
            product: { quote, base },
            side
          }
        }
      }
    } = this.props;

    if (side === 'buy') {
      return base;
    } else if (side === 'sell') {
      return quote;
    } else {
      return null;
    }
  }

  async getReceipt() {
    const {
      navigation: {
        state: {
          params: { orders, side, amount }
        }
      }
    } = this.props;
    const priceAverage = await getAveragePrice(orders, side);

    let subtotal = new BigNumber(amount).mul(priceAverage);
    let fee = new BigNumber(0).negated();
    let total = subtotal.add(fee);

    if (side === 'buy') {
      subtotal = subtotal.negated();
      total = total.negated();
    }

    return {
      priceAverage,
      subtotal,
      fee,
      total
    };
  }

  async submit() {
    let {
      navigation: {
        state: {
          params: { amount, orders, side }
        }
      }
    } = this.props;
    const fillAmount = new BigNumber(amount);

    this.setState({ showFilling: true });
    this.props.navigation.setParams({ hideHeader: true });

    try {
      await fillOrders(orders, fillAmount, side);
    } catch (err) {
      this.setState({ showFilling: false });
      this.props.navigation.setParams({ hideHeader: false });
      NavigationService.error(err);
      return;
    }

    NavigationService.navigate('List');
  }
}

PreviewFillOrders.propTypes = {
  dispatch: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    setParams: PropTypes.func.isRequired,
    state: PropTypes.shape({
      params: PropTypes.shape({
        side: PropTypes.string.isRequired,
        amount: PropTypes.string.isRequired,
        fee: PropTypes.string,
        orders: PropTypes.arrayOf(PropTypes.object).isRequired,
        product: PropTypes.shape({
          base: PropTypes.object.isRequired,
          quote: PropTypes.object.isRequired
        }).isRequired
      }).isRequired
    }).isRequired
  }).isRequired
};

export default connect(() => ({}), dispatch => ({ dispatch }))(
  PreviewFillOrders
);

const styles = {
  tokenAmountLeft: {
    color: colors.primary,
    height: 30
  },
  tokenAmountRight: {
    flex: 1,
    textAlign: 'right',
    height: 30,
    color: colors.primary
  }
};
