
#ifdef _MSC_VER
#pragma warning( disable : 4503 4355 4786 )
#else
#include "config.h"
#endif

#include "Application.h"
#include "quickfix/Session.h"
#include "quickfix/fieldmap.h"
#include "quickfix/fix44/MarketDataIncrementalRefresh.h"
#include <fstream>

void Application::onLogon( const FIX::SessionID& sessionID ) 
{
	std::cout << std::endl << "Logon - " << sessionID << std::endl;
	sessions_.insert(sessions_.end(), sessionID);
}

void Application::onLogout( const FIX::SessionID& sessionID ) 
{	
	std::cout << std::endl << "Logout - " << sessionID << std::endl;
	sessions_.remove(sessionID);
}

void Application::toAdmin( FIX::Message& message, const FIX::SessionID& )
{
	std::cout << std::endl << "ADMIN OUT: " << message << std::endl;
}
void Application::fromAdmin( const FIX::Message& message, const FIX::SessionID& )
  throw( FIX::FieldNotFound, FIX::IncorrectDataFormat, FIX::IncorrectTagValue, FIX::RejectLogon ) 
{
	std::cout << std::endl << "ADMIN IN: " << message << std::endl;
}
void Application::fromApp( const FIX::Message& message,
                           const FIX::SessionID& sessionID )
throw( FIX::FieldNotFound, FIX::IncorrectDataFormat, FIX::IncorrectTagValue, FIX::UnsupportedMessageType )
{
	crack( message, sessionID );
	std::cout << std::endl << "IN: " << message << std::endl;
}

void Application::toApp( FIX::Message& message, const FIX::SessionID& sessionID )
  throw( FIX::DoNotSend ) 
{
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

const char* symbols[]={"bond1","bond2","bond3", "bond4", "bond5"};

void Application::sendXMessages() //send the X messages to all active sessions.
{
	std::ofstream out("d:\\send.txt");
	FIX44::MarketDataIncrementalRefresh message = FIX44::MarketDataIncrementalRefresh();  
	FIX44::MarketDataIncrementalRefresh::NoMDEntries group;
	long count = sizeof(symbols)/(sizeof(symbols[0]) );
	double rnd = count*rand()/(RAND_MAX+1.0);
	FIX::Symbol symbol(symbols[(long)rnd]);
	rnd = 3*rand()/(RAND_MAX+1.0);
	FIX::MDUpdateAction action(rnd<2.0?(rnd<1?'0':'1'):'2');//0=new,1=update,2=delete
	rnd = 2*rand()/(RAND_MAX+1.0);
	std::ostringstream oss;
	oss<<rand();
	FIX::MDEntryID entryID(oss.str());
	FIX::MDEntryType entryType(rnd<1.0?'0':'1');//0=bid, 1=offer
	FIX::MDEntryPx price(100+10*rand()/(RAND_MAX+1.0));	
	FIX::MDEntrySize size((long)(1000*rand()/(RAND_MAX+1.0)));
	FIX::MinQty qty((long)(100*rand()/(RAND_MAX+1.0)));		
	FIX::MinInc inc((long)(100*rand()/(RAND_MAX+1.0)));			
	FIX::MinBR br((long)(1000*rand()/(RAND_MAX+1.0)));			
	FIX::YTM ytm(0.1*rand()/(RAND_MAX+1.0));			
	FIX::YTW ytw(0.1*rand()/(RAND_MAX+1.0));			
	group.set( action );
	group.set( entryID );
	group.set( entryType );
	group.set( symbol );
	group.set( price );
	group.set( size );
	group.set( qty );
	group.setField( FIX::MinInc(inc) );
	group.setField( FIX::MinBR(br) );
	group.setField( FIX::YTM(ytm) );
	group.setField( FIX::YTW(ytw) );
	message.addGroup(group);
	
	out<<message.toXML().c_str()<<std::endl;
	out<<message.toString().c_str()<<std::endl;
	std::list<FIX::SessionID>::const_iterator it;
	for(it=sessions_.begin(); it!=sessions_.end(); it++)
	{
		try
		{
			FIX::Session::sendToTarget( message, *it );
		}
		catch ( FIX::SessionNotFound& ) {
			out<<"error to send the message!"<<std::endl;			
		}
	}
}
