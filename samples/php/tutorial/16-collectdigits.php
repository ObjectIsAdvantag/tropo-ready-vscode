<?php

answer();

$result = ask( "Hello.  Please enter any number", array( "choices" => "[DIGITS]" ) );

if ($result->name=='choice') say( "Great, you said " . $result->value );
	
hangup();

?>

