/* -*- C++ -*- */

#ifdef _MSC_VER
#pragma warning( disable : 4503 4355 4786 )
#else
#include "config.h"
#endif

#include "Application.h"
#include "quickfix/Session.h"
#include "quickfix/fieldmap.h"
#include "quickfix/fix44/MarketDataIncrementalRefresh.h"
#include <iostream>
#include <fstream>

#ifdef WIN32	
#include <Userenv.h> 
#pragma comment(lib,"Userenv.lib")
#else
#include <unistd.h>
#include <sys/types.h>
#include <pwd.h>
#endif

#ifdef WIN32
const int BUFLEN = 512;
BOOL getCurrentUserDir( char* buf, DWORD buflen ){
    HANDLE hToken;

    if( !OpenProcessToken( GetCurrentProcess(), TOKEN_READ, &hToken ))
        return FALSE;

    if( !GetUserProfileDirectory( hToken, buf, &buflen ))
        return FALSE;

    CloseHandle( hToken );
    return TRUE;
}
#endif

std::string getHomeFolder()
{
	#ifdef WIN32
		char buf[ BUFLEN ];
		if( !getCurrentUserDir( buf, BUFLEN )){
			std::cerr << "getCurrentUserDir failed" << std::endl;
			exit( 1 );
		}
		return buf;
	#else
		struct passwd *pw = getpwuid(getuid());
		const char *homedir = pw->pw_dir;
		return homedir;
	#endif
}

void Application::onLogon( const FIX::SessionID& sessionID )
{
  std::cout << std::endl << "Logon - " << sessionID << std::endl;
}

void Application::onLogout( const FIX::SessionID& sessionID )
{
  std::cout << std::endl << "Logout - " << sessionID << std::endl;
}

void Application::toAdmin( FIX::Message& message, const FIX::SessionID& )
{
	//std::cout << std::endl << "ADMIN OUT: " << message << std::endl;
}
void Application::fromAdmin( const FIX::Message& message, const FIX::SessionID& )
  throw( FIX::FieldNotFound, FIX::IncorrectDataFormat, FIX::IncorrectTagValue, FIX::RejectLogon ) 
{
	//std::cout << std::endl << "ADMIN IN: " << message << std::endl;
}
void Application::fromApp( const FIX::Message& message, const FIX::SessionID& sessionID )
throw( FIX::FieldNotFound, FIX::IncorrectDataFormat, FIX::IncorrectTagValue, FIX::UnsupportedMessageType )
{
  std::cout << std::endl << "IN: " << message << std::endl;
  crack( message, sessionID );
}

void Application::toApp( FIX::Message& message, const FIX::SessionID& sessionID )
throw( FIX::DoNotSend )
{
  try
  {
    FIX::PossDupFlag possDupFlag;
    message.getHeader().getField( possDupFlag );
    if ( possDupFlag ) throw FIX::DoNotSend();
  }
  catch ( FIX::FieldNotFound& ) {}

  std::cout << std::endl << "OUT: " << message << std::endl;
}

namespace FIX
{
  namespace FIELD
  {
	const int MinInc = 6350;
	const int MinBR = 6351;
	const int YTM = 6360;
	const int YTW = 6361;
  }
	DEFINE_QTY(MinInc);
	DEFINE_QTY(MinBR);
	DEFINE_PERCENTAGE(YTM);
	DEFINE_PERCENTAGE(YTW);
}
namespace FIX44
{
	class NoMDEntriesBondsPro : public MarketDataIncrementalRefresh::NoMDEntries//add custom fields to the MarketDataIncrementalRefresh message
	{
	public:
		NoMDEntriesBondsPro() : MarketDataIncrementalRefresh::NoMDEntries() {}
		FIELD_SET(*this, FIX::MinInc);
		FIELD_SET(*this, FIX::MinBR);
		FIELD_SET(*this, FIX::YTM);
		FIELD_SET(*this, FIX::YTW);
	};
}

void Application::onMessage
( const FIX44::MarketDataIncrementalRefresh& message, const FIX::SessionID& ) 
{
	FIX::NoMDEntries noMDEntries;
    message.get(noMDEntries);
	if (noMDEntries.getValue()!=1){
		std::cout << "NoMDEntries in MarketDataIncrementalRefresh is not 1!" <<std::endl;
		return;
	}
	FIX44::MarketDataIncrementalRefresh::NoMDEntries group;
	message.getGroup(1, group);

	FIX::MDEntryID entryID; group.get(entryID);      
	FIX::MDUpdateAction action; group.get(action);  
	char actionvalue = action.getValue();//0=New, 1=Update, 2=Delete)
	if (actionvalue=='2') //ignore the delete
	{
		std::map<std::string, SECURITY>::iterator it = securities_.end();
		it=securities_.find(entryID);
		if (it!=securities_.end())
			securities_.erase(it);
		return;
	}
	SECURITY security;
	security.MDEntryID = entryID;
	security.MDUpdateAction = action;
	FIX::Symbol symbol;		
	if(group.isSet(symbol)){
		group.get(symbol); 
		security.Symbol = symbol;
	}
	FIX::MDEntryType entryType; 
	if(group.isSet(entryType)) {
		group.get(entryType);      
		security.MDEntryType = entryType;
	}
	FIX::MDEntryPx price;	
	if(group.isSet(price)) {
		group.get(price); 
		security.MDEntryPx		= price.getValue();
	}
	FIX::MDEntrySize size;	
	if(group.isSet(size)) {
		group.get(size); 
		security.MDEntrySize	= size.getValue();
	}
	FIX::MinQty qty;		
	if(group.isSet(qty)) {
		group.get(qty); 
		security.MinQty			= qty.getValue();
	}
	FIX::MinInc inc;		
	if(message.isSetField(inc)) {
		message.getField(inc); 
		security.MinInc			= inc.getValue();
	}
	FIX::MinBR br;			
	if(message.isSetField(br)) {
		message.getField(br); 
		security.MinBR			= br.getValue();
	}
	FIX::YTM ytm;			
	if(message.isSetField(ytm)) {
		message.getField(ytm); 
		security.YTM			= ytm.getValue();
	}
	FIX::YTW ytw;			
	if(message.isSetField(ytw)) {
		message.getField(ytw); 
		security.YTW			= ytw.getValue();
	}
	securities_[entryID] = security;
} 
void Application::onMessage
( const FIX44::ExecutionReport&, const FIX::SessionID& ) {}
void Application::onMessage
( const FIX44::OrderCancelReject&, const FIX::SessionID& ) {}

void Application::run()
{
  while ( true )
  {
    try
    {
      char action = queryAction();
		
	  /*
      if ( action == '1' )
        queryEnterOrder();
      else if ( action == '2' )
        queryCancelOrder();
      else if ( action == '3' )
        queryReplaceOrder();
      else if ( action == '4' )
        queryMarketDataRequest();		
	  else*/ if ( action == '1' ){
        fillSnapshot();
	  }
      else if ( action == '2' )
        break;
    }
    catch ( std::exception & e )
    {
      std::cout << "Message Not Sent: " << e.what();
    }
  }
}


void Application::fillSnapshot()
{
	if (securities_.size()==0){
		std::cout << "Empty snapshot, something is wrong when getting the market data from bonds.com! " <<std::endl;
		return;
	}
	std::string file = getHomeFolder()+"\\bonds.com.snapshot.txt";
	std::ofstream out(file.c_str());	
	std::map<std::string, SECURITY>::const_iterator it;
	std::vector<SECURITY> securities;
	out<<"bonds.com snapshot"<<std::endl;
	out<<"cusip,entryid, updateaction, bid/ask, price, size, balance, increment, qty, ytm, ytw"<<std::endl;
	for(it=securities_.begin(); it!=securities_.end(); it++){
		securities.push_back(it->second);
	}
	std::sort(securities.begin(), securities.end());
	std::vector<SECURITY>::const_iterator itsec;
	for(itsec=securities.begin(); itsec!=securities.end(); itsec++){
		out<<itsec->Symbol;
		out<<","<<itsec->MDEntryID;
		out<<","<<(itsec->MDUpdateAction=='0'?"New":"Update");
		out<<","<<(itsec->MDEntryType=='0'?"Bid":"Ask");
		out<<","<<itsec->MDEntryPx;
		out<<","<<itsec->MDEntrySize;
		out<<","<<itsec->MinBR;
		out<<","<<itsec->MinInc;
		out<<","<<itsec->MinQty;
		out<<","<<itsec->YTM;
		out<<","<<itsec->YTW<<std::endl;
	}
	std::cout << "The bonds.com snapshot has been filled to " << file.c_str() <<std::endl;
	return;
}

void Application::queryEnterOrder()
{
  int version = queryVersion();
  std::cout << "\nNewOrderSingle\n";
  FIX::Message order;

  switch ( version ) {
  case 44:
    order = queryNewOrderSingle44();
    break;
  case 50:
    order = queryNewOrderSingle50();
    break;
  default:
    std::cerr << "No test for version " << version << std::endl;
    break;
  }

  if ( queryConfirm( "Send order" ) )
    FIX::Session::sendToTarget( order );
}

void Application::queryCancelOrder()
{
  int version = queryVersion();
  std::cout << "\nOrderCancelRequest\n";
  FIX::Message cancel;

  switch ( version ) {
  case 44:
    cancel = queryOrderCancelRequest44();
    break;
  case 50:
    cancel = queryOrderCancelRequest50();
    break;
  default:
    std::cerr << "No test for version " << version << std::endl;
    break;
  }

  if ( queryConfirm( "Send cancel" ) )
    FIX::Session::sendToTarget( cancel );
}

void Application::queryReplaceOrder()
{
  int version = queryVersion();
  std::cout << "\nCancelReplaceRequest\n";
  FIX::Message replace;

  switch ( version ) {
  case 44:
    replace = queryCancelReplaceRequest44();
    break;
  case 50:
    replace = queryCancelReplaceRequest50();
    break;
  default:
    std::cerr << "No test for version " << version << std::endl;
    break;
  }

  if ( queryConfirm( "Send replace" ) )
    FIX::Session::sendToTarget( replace );
}

void Application::queryMarketDataRequest()
{
  int version = queryVersion();
  std::cout << "\nMarketDataRequest\n";
  FIX::Message md;

  switch (version) {
  case 44:
    md = queryMarketDataRequest44();
    break;
  case 50:
    md = queryMarketDataRequest50();
    break;
  default:
    std::cerr << "No test for version " << version << std::endl;
    break;
  }

  FIX::Session::sendToTarget( md );
}


FIX44::NewOrderSingle Application::queryNewOrderSingle44()
{
  FIX::OrdType ordType;

  FIX44::NewOrderSingle newOrderSingle(
    queryClOrdID(), querySide(),
    FIX::TransactTime(), ordType = queryOrdType() );

  newOrderSingle.set( FIX::HandlInst('1') );
  newOrderSingle.set( querySymbol() );
  newOrderSingle.set( queryOrderQty() );
  newOrderSingle.set( queryTimeInForce() );
  if ( ordType == FIX::OrdType_LIMIT || ordType == FIX::OrdType_STOP_LIMIT )
    newOrderSingle.set( queryPrice() );
  if ( ordType == FIX::OrdType_STOP || ordType == FIX::OrdType_STOP_LIMIT )
    newOrderSingle.set( queryStopPx() );

  queryHeader( newOrderSingle.getHeader() );
  return newOrderSingle;
}

FIX50::NewOrderSingle Application::queryNewOrderSingle50()
{
  FIX::OrdType ordType;

  FIX50::NewOrderSingle newOrderSingle(
    queryClOrdID(), querySide(),
    FIX::TransactTime(), ordType = queryOrdType() );

  newOrderSingle.set( FIX::HandlInst('1') );
  newOrderSingle.set( querySymbol() );
  newOrderSingle.set( queryOrderQty() );
  newOrderSingle.set( queryTimeInForce() );
  if ( ordType == FIX::OrdType_LIMIT || ordType == FIX::OrdType_STOP_LIMIT )
    newOrderSingle.set( queryPrice() );
  if ( ordType == FIX::OrdType_STOP || ordType == FIX::OrdType_STOP_LIMIT )
    newOrderSingle.set( queryStopPx() );

  queryHeader( newOrderSingle.getHeader() );
  return newOrderSingle;
}


FIX44::OrderCancelRequest Application::queryOrderCancelRequest44()
{
  FIX44::OrderCancelRequest orderCancelRequest( queryOrigClOrdID(),
      queryClOrdID(), querySide(), FIX::TransactTime() );

  orderCancelRequest.set( querySymbol() );
  orderCancelRequest.set( queryOrderQty() );
  queryHeader( orderCancelRequest.getHeader() );
  return orderCancelRequest;
}

FIX50::OrderCancelRequest Application::queryOrderCancelRequest50()
{
  FIX50::OrderCancelRequest orderCancelRequest( queryOrigClOrdID(),
      queryClOrdID(), querySide(), FIX::TransactTime() );

  orderCancelRequest.set( querySymbol() );
  orderCancelRequest.set( queryOrderQty() );
  queryHeader( orderCancelRequest.getHeader() );
  return orderCancelRequest;
}


FIX44::OrderCancelReplaceRequest Application::queryCancelReplaceRequest44()
{
  FIX44::OrderCancelReplaceRequest cancelReplaceRequest(
    queryOrigClOrdID(), queryClOrdID(),
    querySide(), FIX::TransactTime(), queryOrdType() );

  cancelReplaceRequest.set( FIX::HandlInst('1') );
  cancelReplaceRequest.set( querySymbol() );
  if ( queryConfirm( "New price" ) )
    cancelReplaceRequest.set( queryPrice() );
  if ( queryConfirm( "New quantity" ) )
    cancelReplaceRequest.set( queryOrderQty() );

  queryHeader( cancelReplaceRequest.getHeader() );
  return cancelReplaceRequest;
}

FIX50::OrderCancelReplaceRequest Application::queryCancelReplaceRequest50()
{
  FIX50::OrderCancelReplaceRequest cancelReplaceRequest(
    queryOrigClOrdID(), queryClOrdID(),
    querySide(), FIX::TransactTime(), queryOrdType() );

  cancelReplaceRequest.set( FIX::HandlInst('1') );
  cancelReplaceRequest.set( querySymbol() );
  if ( queryConfirm( "New price" ) )
    cancelReplaceRequest.set( queryPrice() );
  if ( queryConfirm( "New quantity" ) )
    cancelReplaceRequest.set( queryOrderQty() );

  queryHeader( cancelReplaceRequest.getHeader() );
  return cancelReplaceRequest;
}


FIX44::MarketDataRequest Application::queryMarketDataRequest44()
{
  FIX::MDReqID mdReqID( "MARKETDATAID" );
  FIX::SubscriptionRequestType subType( FIX::SubscriptionRequestType_SNAPSHOT );
  FIX::MarketDepth marketDepth( 0 );

  FIX44::MarketDataRequest::NoMDEntryTypes marketDataEntryGroup;
  FIX::MDEntryType mdEntryType( FIX::MDEntryType_BID );
  marketDataEntryGroup.set( mdEntryType );

  FIX44::MarketDataRequest::NoRelatedSym symbolGroup;
  FIX::Symbol symbol( "LNUX" );
  symbolGroup.set( symbol );

  FIX44::MarketDataRequest message( mdReqID, subType, marketDepth );
  message.addGroup( marketDataEntryGroup );
  message.addGroup( symbolGroup );

  queryHeader( message.getHeader() );

  std::cout << message.toXML() << std::endl;
  std::cout << message.toString() << std::endl;

  return message;
}

FIX50::MarketDataRequest Application::queryMarketDataRequest50()
{
  FIX::MDReqID mdReqID( "MARKETDATAID" );
  FIX::SubscriptionRequestType subType( FIX::SubscriptionRequestType_SNAPSHOT );
  FIX::MarketDepth marketDepth( 0 );

  FIX50::MarketDataRequest::NoMDEntryTypes marketDataEntryGroup;
  FIX::MDEntryType mdEntryType( FIX::MDEntryType_BID );
  marketDataEntryGroup.set( mdEntryType );

  FIX50::MarketDataRequest::NoRelatedSym symbolGroup;
  FIX::Symbol symbol( "LNUX" );
  symbolGroup.set( symbol );

  FIX50::MarketDataRequest message( mdReqID, subType, marketDepth );
  message.addGroup( marketDataEntryGroup );
  message.addGroup( symbolGroup );

  queryHeader( message.getHeader() );

  std::cout << message.toXML() << std::endl;
  std::cout << message.toString() << std::endl;

  return message;
}

void Application::queryHeader( FIX::Header& header )
{
  header.setField( querySenderCompID() );
  header.setField( queryTargetCompID() );

  if ( queryConfirm( "Use a TargetSubID" ) )
    header.setField( queryTargetSubID() );
}

char Application::queryAction()
{
  char value;
  std::cout << std::endl
  //<< "1) Enter Order(Sample)" << std::endl
  //<< "2) Cancel Order(Sample)" << std::endl
  //<< "3) Replace Order(Sample)" << std::endl
  //<< "4) Market data test(Sample)" << std::endl
  << "1) Fill bonds.com snapshot" << std::endl
  << "2) Quit" << std::endl
  << "Action: ";
  std::cin >> value;
  switch ( value )
  {
    case '1': case '2': case '3': case '4': case '5': case '6': break;
    default: throw std::exception();
  }
  return value;
}

int Application::queryVersion()
{
  char value;
  std::cout << std::endl
  << "1) FIX.4.4" << std::endl
  << "2) FIXT.1.1 (FIX.5.0)" << std::endl
  << "BeginString: ";
  std::cin >> value;
  switch ( value )
  {
    case '1': return 44;
    case '2': return 50;
    default: throw std::exception();
  }
}

bool Application::queryConfirm( const std::string& query )
{
  std::string value;
  std::cout << std::endl << query << "?: ";
  std::cin >> value;
  return toupper( *value.c_str() ) == 'Y';
}

FIX::SenderCompID Application::querySenderCompID()
{
  std::string value;
  std::cout << std::endl << "SenderCompID: ";
  std::cin >> value;
  return FIX::SenderCompID( value );
}

FIX::TargetCompID Application::queryTargetCompID()
{
  std::string value;
  std::cout << std::endl << "TargetCompID: ";
  std::cin >> value;
  return FIX::TargetCompID( value );
}

FIX::TargetSubID Application::queryTargetSubID()
{
  std::string value;
  std::cout << std::endl << "TargetSubID: ";
  std::cin >> value;
  return FIX::TargetSubID( value );
}

FIX::ClOrdID Application::queryClOrdID()
{
  std::string value;
  std::cout << std::endl << "ClOrdID: ";
  std::cin >> value;
  return FIX::ClOrdID( value );
}

FIX::OrigClOrdID Application::queryOrigClOrdID()
{
  std::string value;
  std::cout << std::endl << "OrigClOrdID: ";
  std::cin >> value;
  return FIX::OrigClOrdID( value );
}

FIX::Symbol Application::querySymbol()
{
  std::string value;
  std::cout << std::endl << "Symbol: ";
  std::cin >> value;
  return FIX::Symbol( value );
}

FIX::Side Application::querySide()
{
  char value;
  std::cout << std::endl
  << "1) Buy" << std::endl
  << "2) Sell" << std::endl
  << "3) Sell Short" << std::endl
  << "4) Sell Short Exempt" << std::endl
  << "5) Cross" << std::endl
  << "6) Cross Short" << std::endl
  << "7) Cross Short Exempt" << std::endl
  << "Side: ";

  std::cin >> value;
  switch ( value )
  {
    case '1': return FIX::Side( FIX::Side_BUY );
    case '2': return FIX::Side( FIX::Side_SELL );
    case '3': return FIX::Side( FIX::Side_SELL_SHORT );
    case '4': return FIX::Side( FIX::Side_SELL_SHORT_EXEMPT );
    case '5': return FIX::Side( FIX::Side_CROSS );
    case '6': return FIX::Side( FIX::Side_CROSS_SHORT );
    case '7': return FIX::Side( 'A' );
    default: throw std::exception();
  }
}

FIX::OrderQty Application::queryOrderQty()
{
  long value;
  std::cout << std::endl << "OrderQty: ";
  std::cin >> value;
  return FIX::OrderQty( value );
}

FIX::OrdType Application::queryOrdType()
{
  char value;
  std::cout << std::endl
  << "1) Market" << std::endl
  << "2) Limit" << std::endl
  << "3) Stop" << std::endl
  << "4) Stop Limit" << std::endl
  << "OrdType: ";

  std::cin >> value;
  switch ( value )
  {
    case '1': return FIX::OrdType( FIX::OrdType_MARKET );
    case '2': return FIX::OrdType( FIX::OrdType_LIMIT );
    case '3': return FIX::OrdType( FIX::OrdType_STOP );
    case '4': return FIX::OrdType( FIX::OrdType_STOP_LIMIT );
    default: throw std::exception();
  }
}

FIX::Price Application::queryPrice()
{
  double value;
  std::cout << std::endl << "Price: ";
  std::cin >> value;
  return FIX::Price( value );
}

FIX::StopPx Application::queryStopPx()
{
  double value;
  std::cout << std::endl << "StopPx: ";
  std::cin >> value;
  return FIX::StopPx( value );
}

FIX::TimeInForce Application::queryTimeInForce()
{
  char value;
  std::cout << std::endl
  << "1) Day" << std::endl
  << "2) IOC" << std::endl
  << "3) OPG" << std::endl
  << "4) GTC" << std::endl
  << "5) GTX" << std::endl
  << "TimeInForce: ";

  std::cin >> value;
  switch ( value )
  {
    case '1': return FIX::TimeInForce( FIX::TimeInForce_DAY );
    case '2': return FIX::TimeInForce( FIX::TimeInForce_IMMEDIATE_OR_CANCEL );
    case '3': return FIX::TimeInForce( FIX::TimeInForce_AT_THE_OPENING );
    case '4': return FIX::TimeInForce( FIX::TimeInForce_GOOD_TILL_CANCEL );
    case '5': return FIX::TimeInForce( FIX::TimeInForce_GOOD_TILL_CROSSING );
    default: throw std::exception();
  }
}
