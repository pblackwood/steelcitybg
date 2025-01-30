<?php

class RedeemAPI {
    // Main method to redeem a code
    function redeem() {
        echo "<h1>Hello again from PHP!</h1>";
    }
}

// This is the first thing that gets called when this page is loaded
// Creates a new instance of the RedeemAPI class and calls the redeem method
$api = new RedeemAPI;
$api->redeem();

?>
