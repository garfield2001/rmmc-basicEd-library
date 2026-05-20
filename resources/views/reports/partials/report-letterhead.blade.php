@if ($logoDataUri ?? null)
    <table class="school-letterhead">
        <tr>
            <td class="letterhead-logo-cell">
                <img class="letterhead-logo" src="{{ $logoDataUri }}" alt="RMMC logo" width="91" height="91" style="height: 0.95in; width: 0.95in;">
            </td>
            <td class="letterhead-text">
                <div class="school-name">RAMON MAGSAYSAY MEMORIAL<br>COLLEGES INTEGRATED SCHOOL</div>
                <p class="school-address">Ventilation St., Lagao, General Santos City, Philippines</p>
                <p class="school-contact"><span>rmmcbep@gmail.com</span> / +639518240218</p>
            </td>
            <td class="letterhead-logo-cell">
                <img class="letterhead-logo" src="{{ $logoDataUri }}" alt="RMMC logo" width="91" height="91" style="height: 0.95in; width: 0.95in;">
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
