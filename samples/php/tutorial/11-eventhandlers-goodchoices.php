<?php
// -----------
// handling good choices with event handlers too
// -----------

answer();

ask( "Hi. For sales, just say sales or press 1. For support, say support or press 2.", 
			array(
			  "choices"     => "sales( 1, sales), support( 2, support)", 
			  "repeat"      => 3,
			  "onBadChoice" => create_function( '$event', 'say("I am sorry, I did not understand what you said.");' ),
			  "onTimeout"   => create_function( '$event', 'say("I am sorry.  I didn\'t hear anything.");' ),
			  "onChoice"    => create_function( '$event', 
				'if ($event->value == "sales")
				{
					say( "Ok, let me transfer you to sales." );
					transfer( "tel:+14129272358" );
				}
				if ($event->value == "support")
				{
					say( "Sure, let me get support.  Please hold." );
					transfer( "tel:+14129272341" );
				}'			
			  )		
			)
		);
?>			
