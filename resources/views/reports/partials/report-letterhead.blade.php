@php
    $leftLogo = $leftLogoDataUri ?? $logoDataUri ?? null;
    $rightLogo = $rightLogoDataUri ?? $logoDataUri ?? null;
@endphp

@if ($leftLogo || $rightLogo)
    <table class="school-letterhead">
        <tr>
            <td class="letterhead-logo-cell">
                @if ($leftLogo)
                    <img class="letterhead-logo" src="{{ $leftLogo }}" alt="RMMC left logo" width="91" height="91" style="height: 0.95in; width: 0.95in;">
                @endif
            </td>
            <td class="letterhead-text">
                <div class="school-name">RAMON MAGSAYSAY MEMORIAL<br>COLLEGES INTEGRATED SCHOOL</div>
                <p class="school-address">Ventilation St., Lagao, General Santos City, Philippines</p>
                <p class="school-contact"><span>rmmcbep@gmail.com</span> / +639518240218</p>
            </td>
            <td class="letterhead-logo-cell">
                @if ($rightLogo)
                    <img class="letterhead-logo" src="{{ $rightLogo }}" alt="RMMC right logo" width="91" height="91" style="height: 0.95in; width: 0.95in;">
                @endif
            </td>
        </tr>
    </table>
@else
    <div class="export-header">
        <div class="school-name">RAMON MAGSAYSAY MEMORIAL<br>COLLEGES INTEGRATED SCHOOL</div>
        <p class="school-address">Ventilation St., Lagao, General Santos City, Philippines</p>
        <p class="school-contact"><span>rmmcbep@gmail.com</span> / +639518240218</p>
    </div>
@endif
